import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR   = path.join(__dirname, 'data', 'reports')

// 데이터 디렉토리 초기화
await fs.mkdir(DATA_DIR, { recursive: true })

let reportIndex = []
try {
  const raw = await fs.readFile(path.join(DATA_DIR, 'index.json'), 'utf-8')
  reportIndex = JSON.parse(raw)
} catch { reportIndex = [] }

async function persistIndex() {
  await fs.writeFile(path.join(DATA_DIR, 'index.json'), JSON.stringify(reportIndex, null, 2))
}

const app = express()
app.use(cors())
app.use(express.json())

// Anthropic client는 요청별 API 키로 생성 (x-api-key 헤더 우선)
let ECOS_KEY = process.env.ECOS_API_KEY
let FRED_KEY = process.env.FRED_API_KEY

function getAnthropicClient(req) {
  const key = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Claude API 키가 필요합니다. 설정 페이지에서 입력해주세요.')
  return new Anthropic({ apiKey: key })
}

// ─────────────────────────────────────────────
// 날짜 유틸
// ─────────────────────────────────────────────
function toYYYYMMDD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}
function toYYYYMM(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}
function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toYYYYMMDD(d)
}
function nMonthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return toYYYYMM(d)
}

// ─────────────────────────────────────────────
// ECOS 헬퍼
// ─────────────────────────────────────────────
async function fetchEcosRows(statCode, cycle, itemCode) {
  const today = toYYYYMMDD(new Date())
  const start = cycle === 'D' ? nDaysAgo(14) : nMonthsAgo(4)
  const end   = cycle === 'D' ? today : toYYYYMM(new Date())
  const url   = `https://ecos.bok.or.kr/api/StatisticSearch/${ECOS_KEY}/json/kr/1/10/${statCode}/${cycle}/${start}/${end}/${itemCode}`
  const res   = await fetch(url)
  const data  = await res.json()
  return (data.StatisticSearch?.row || []).sort((a, b) => a.TIME.localeCompare(b.TIME))
}

// row 배열에서 최신값과 전일 대비 bp 변동 추출
function parseRateBp(rows) {
  if (!rows.length) return null
  const latest = parseFloat(rows.at(-1).DATA_VALUE)
  if (isNaN(latest)) return null
  if (rows.length < 2) return { value: latest, change: 0 }
  const prev   = parseFloat(rows.at(-2).DATA_VALUE)
  const change = Math.round((latest - prev) * 100)   // bp
  return { value: latest, change }
}

// USD/KRW 는 원 단위 변동
function parseWon(rows) {
  if (!rows.length) return null
  const latest = parseFloat(rows.at(-1).DATA_VALUE)
  if (isNaN(latest)) return null
  if (rows.length < 2) return { value: latest, change: 0 }
  const prev   = parseFloat(rows.at(-2).DATA_VALUE)
  return { value: latest, change: parseFloat((latest - prev).toFixed(1)) }
}

// ─────────────────────────────────────────────
// FRED 헬퍼
// ─────────────────────────────────────────────
async function fetchFredValue(seriesId) {
  const url  = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=5`
  const res  = await fetch(url)
  const data = await res.json()
  const obs  = (data.observations || []).filter(o => o.value !== '.').slice(0, 2)
  if (!obs.length) return null
  const latest = parseFloat(obs[0].value)
  if (isNaN(latest)) return null
  if (obs.length < 2) return { value: latest, change: 0 }
  const prev   = parseFloat(obs[1].value)
  const change = Math.round((latest - prev) * 100)  // bp
  return { value: latest, change }
}

// FRED 히스토리 (최근 N개, 오름차순)
async function fetchFredHistory(seriesId, limit = 25) {
  const url  = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}`
  const res  = await fetch(url)
  const data = await res.json()
  return (data.observations || [])
    .filter(o => o.value !== '.')
    .reverse()
    .slice(-20)
    .map(o => ({ date: o.date.slice(5), value: parseFloat(o.value) }))
}

// ─────────────────────────────────────────────
// Yahoo Finance 헬퍼
// ─────────────────────────────────────────────
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'application/json',
}

async function fetchYahooValue(symbol) {
  const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=10d`
  const res  = await fetch(url, { headers: YAHOO_HEADERS })
  const data = await res.json()
  const r    = data.chart?.result?.[0]
  if (!r) return null
  const closes = (r.indicators?.quote?.[0]?.close || []).filter(v => v != null)
  if (!closes.length) return null
  const latest = closes.at(-1)
  const prev   = closes.length >= 2 ? closes.at(-2) : latest
  return { value: parseFloat(latest.toFixed(4)), change: parseFloat((latest - prev).toFixed(4)) }
}

async function fetchYahooHistory(symbol, limit = 20) {
  const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=60d`
  const res  = await fetch(url, { headers: YAHOO_HEADERS })
  const data = await res.json()
  const r    = data.chart?.result?.[0]
  if (!r) return []
  const timestamps = r.timestamp || []
  const closes     = r.indicators?.quote?.[0]?.close || []
  return timestamps
    .map((ts, i) => {
      const d = new Date(ts * 1000)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return { date: `${mm}/${dd}`, value: closes[i] }
    })
    .filter(p => p.value != null)
    .slice(-limit)
}

// ─────────────────────────────────────────────
// GET /api/market/fetch
// ─────────────────────────────────────────────
app.get('/api/market/fetch', async (req, res) => {
  const errors = []
  const status = { ecos: 'ok', fred: 'ok', yahoo: 'ok' }

  // ── ECOS ──
  let ecosData = {}
  try {
    const [
      baseRateRows,
      callRows, cdRows, cpRows,
      ktb1yRows, ktb2yRows, ktb3yRows, ktb5yRows,
      ktb10yRows, ktb20yRows, ktb30yRows,
      usdKrwRows,
    ] = await Promise.all([
      fetchEcosRows('722Y001', 'M', '0101000'),  // 기준금리 (월별)
      fetchEcosRows('817Y002', 'D', 'A00'),       // 콜금리
      fetchEcosRows('817Y002', 'D', 'A020'),      // CD 91일
      fetchEcosRows('817Y002', 'D', 'A030'),      // CP 91일
      fetchEcosRows('817Y002', 'D', 'A047'),      // 국고채 1Y
      fetchEcosRows('817Y002', 'D', 'A048'),      // 국고채 2Y
      fetchEcosRows('817Y002', 'D', 'A049'),      // 국고채 3Y
      fetchEcosRows('817Y002', 'D', 'A050'),      // 국고채 5Y
      fetchEcosRows('817Y002', 'D', 'A051'),      // 국고채 10Y
      fetchEcosRows('817Y002', 'D', 'A052'),      // 국고채 20Y
      fetchEcosRows('817Y002', 'D', 'A053'),      // 국고채 30Y
      fetchEcosRows('731Y001', 'D', '0000001'),   // USD/KRW
    ])

    // 날짜는 3Y 기준
    const latestTime = ktb3yRows.at(-1)?.TIME || toYYYYMMDD(new Date())
    const date = `${latestTime.slice(0, 4)}-${latestTime.slice(4, 6)}-${latestTime.slice(6, 8)}`

    const baseRateVal = parseFloat(baseRateRows.at(-1)?.DATA_VALUE)

    ecosData = {
      date,
      baseRate: isNaN(baseRateVal) ? null : baseRateVal,
      call:   parseRateBp(callRows),
      cd91:   parseRateBp(cdRows),
      cp91:   parseRateBp(cpRows),
      ktb1y:  parseRateBp(ktb1yRows),
      ktb2y:  parseRateBp(ktb2yRows),
      ktb3y:  parseRateBp(ktb3yRows),
      ktb5y:  parseRateBp(ktb5yRows),
      ktb10y: parseRateBp(ktb10yRows),
      ktb20y: parseRateBp(ktb20yRows),
      ktb30y: parseRateBp(ktb30yRows),
      usdKrw: parseWon(usdKrwRows),
    }
  } catch (e) {
    status.ecos = 'error'
    errors.push(`ECOS: ${e.message}`)
  }

  // ── FRED ──
  let fredData = {}
  try {
    const [ust2y, ust10y, ust30y, sofr] = await Promise.all([
      fetchFredValue('DGS2'),
      fetchFredValue('DGS10'),
      fetchFredValue('DGS30'),
      fetchFredValue('SOFR'),
    ])
    fredData = { ust2y, ust10y, ust30y, sofr }
  } catch (e) {
    status.fred = 'error'
    errors.push(`FRED: ${e.message}`)
  }

  // ── Yahoo Finance ──
  let yahooData = {}
  try {
    const [eurKrw, jpyKrw, cnhKrw, dxy, sp500, nasdaq, kospi, nikkei, vix, wti, gold] = await Promise.all([
      fetchYahooValue('EURKRW=X'),
      fetchYahooValue('JPYKRW=X'),
      fetchYahooValue('CNHKRW=X'),
      fetchYahooValue('DX-Y.NYB'),
      fetchYahooValue('^GSPC'),
      fetchYahooValue('^IXIC'),
      fetchYahooValue('^KS11'),
      fetchYahooValue('^N225'),
      fetchYahooValue('^VIX'),
      fetchYahooValue('CL=F'),
      fetchYahooValue('GC=F'),
    ])
    yahooData = { eurKrw, jpyKrw, cnhKrw, dxy, sp500, nasdaq, kospi, nikkei, vix, wti, gold }
  } catch (e) {
    status.yahoo = 'error'
    errors.push(`Yahoo: ${e.message}`)
  }

  // ── 히스토리 (20영업일) ──
  let historyData = {}
  try {
    const [ktb3yH, ktb10yH, usdKrwH, ust10yH] = await Promise.all([
      fetchEcosRows('817Y002', 'D', 'A049').then(rows =>
        rows.slice(-20).map(r => ({ date: `${r.TIME.slice(4, 6)}/${r.TIME.slice(6, 8)}`, value: parseFloat(r.DATA_VALUE) }))
      ),
      fetchEcosRows('817Y002', 'D', 'A051').then(rows =>
        rows.slice(-20).map(r => ({ date: `${r.TIME.slice(4, 6)}/${r.TIME.slice(6, 8)}`, value: parseFloat(r.DATA_VALUE) }))
      ),
      fetchEcosRows('731Y001', 'D', '0000001').then(rows =>
        rows.slice(-20).map(r => ({ date: `${r.TIME.slice(4, 6)}/${r.TIME.slice(6, 8)}`, value: parseFloat(r.DATA_VALUE) }))
      ),
      fetchFredHistory('DGS10', 20),
    ])
    historyData = { ktb3y: ktb3yH, ktb10y: ktb10yH, usdKrw: usdKrwH, ust10y: ust10yH }
  } catch (e) {
    errors.push(`History: ${e.message}`)
  }

  res.json({ ecosData, fredData, yahooData, historyData, status, errors })
})

// ─────────────────────────────────────────────
// 최근 뉴스 헤드라인 수집 (RSS 파싱)
// ─────────────────────────────────────────────
const NEWS_FEEDS = [
  'https://www.yonhapnews.co.kr/rss/economy.xml',
  'https://rss.hankyung.com/economy.xml',
  'https://www.edaily.co.kr/rss/news.xml',
  'https://feeds.bbci.co.uk/news/business/rss.xml',
]

async function fetchRecentNews() {
  const headlines = []
  for (const url of NEWS_FEEDS) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; iMBankTradingDesk/1.0)' },
      })
      if (!r.ok) continue
      const xml = await r.text()

      // CDATA 형식: <title><![CDATA[...]]></title>
      let titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]{5,200})\]\]><\/title>/g)]
        .map(m => m[1].trim())

      // 일반 형식: <title>...</title>
      if (titles.length === 0) {
        titles = [...xml.matchAll(/<title>([^<]{5,200})<\/title>/g)]
          .map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim())
      }

      // 피드 제목(첫 번째 항목) 제외, URL 아닌 것만
      const filtered = titles.slice(1).filter(t => !t.startsWith('http') && t.length > 5)
      headlines.push(...filtered.slice(0, 5))
      if (headlines.length >= 15) break
    } catch {
      // 해당 피드 건너뜀
    }
  }
  return headlines.slice(0, 12)
}

// GET /api/news — 프론트엔드용 헤드라인 조회
app.get('/api/news', async (_req, res) => {
  const headlines = await fetchRecentNews()
  res.json({ headlines, fetchedAt: new Date().toISOString() })
})

// ─────────────────────────────────────────────
// 공통: 지정학 컨텍스트 블록
// ─────────────────────────────────────────────
function geoBlock(geoContext) {
  if (!geoContext?.trim()) return ''
  return `\n■ 주요 이슈 / 지정학적 이벤트\n${geoContext.trim()}\n`
}

function newsBlock(headlines) {
  if (!headlines?.length) return ''
  return `\n■ 최근 주요 뉴스 헤드라인 (생성 시점 기준)\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`
}

// ─────────────────────────────────────────────
// POST /api/narrative/weekly
// ─────────────────────────────────────────────
app.post('/api/narrative/weekly', async (req, res) => {
  const { snapshot, weekEvents, geoContext } = req.body
  const { rates, fx, overseas } = snapshot

  const bp  = v => (v > 0 ? `+${v}bp` : `${v}bp`)
  const chg = (v, d = 1) => (v > 0 ? `+${v.toFixed(d)}` : v.toFixed(d))

  const dataContext = `[주간 시장 데이터 — ${snapshot.date} 기준]

■ 주말 금리 (주간 누적 변동 참고)
- 기준금리: ${rates.baseRate}%
- 국고채 3Y: ${rates.ktb3y.value}% (일별 ${bp(rates.ktb3y.change)})
- 국고채 5Y: ${rates.ktb5y.value}% (일별 ${bp(rates.ktb5y.change)})
- 국고채 10Y: ${rates.ktb10y.value}% (일별 ${bp(rates.ktb10y.change)})
- 장단기 스프레드(10Y-3Y): ${Math.round((rates.ktb10y.value - rates.ktb3y.value) * 100)}bp
- CD 91일: ${rates.cd91.value}% / CP 91일: ${rates.cp91.value}%
- IRS 3Y: ${rates.irs3y.value}% / IRS 5Y: ${rates.irs5y.value}%
- 은행채 AAA 3Y: ${rates.bankBond3y.value}% (KTB 스프레드: ${Math.round((rates.bankBond3y.value - rates.ktb3y.value) * 100)}bp)
- 회사채 AA- 3Y: ${rates.corpAAMinus3y.value}% (KTB 스프레드: ${Math.round((rates.corpAAMinus3y.value - rates.ktb3y.value) * 100)}bp)

■ 주말 외환/해외
- USD/KRW: ${fx.usdKrw.value.toFixed(1)}원 (일별 ${chg(fx.usdKrw.change, 1)}원)
- EUR/KRW: ${fx.eurKrw.value.toFixed(1)}원 / DXY: ${fx.dxy.value.toFixed(2)}
- 미 국채 2Y: ${overseas.ust2y.value}% (${bp(overseas.ust2y.change)}) / 10Y: ${overseas.ust10y.value}% (${bp(overseas.ust10y.change)})
- SOFR: ${overseas.sofr.value}% / EURIBOR 3M: ${overseas.euribor3m.value}%
- KOSPI: ${overseas.kospi.value.toLocaleString()} / S&P500: ${overseas.sp500.value.toLocaleString()}
- VIX: ${overseas.vix.value.toFixed(1)} / WTI: $${overseas.wti.value.toFixed(1)} / 금: $${overseas.gold.value.toLocaleString()}
- 한국 CDS 5Y: ${overseas.koreaCds5y.value.toFixed(1)}bp
${geoBlock(geoContext)}
■ 차주 주요 일정
${(weekEvents || []).filter(e => !e.actual).map(e =>
  `- ${e.time} [${e.country}] ${e.event} (이전: ${e.previous}, 예상: ${e.forecast})`
).join('\n')}`

  const news = await fetchRecentNews()
  try {
    const response = await getAnthropicClient(req).messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1400,
      system: `당신은 국내 시중은행 자금시장부의 시니어 채권·외환 애널리스트입니다. 매주 금요일 임원 및 딜러들에게 배포하는 '주간 마켓리뷰'의 총평을 작성합니다.

작성 원칙:
- 주간 흐름을 관통한 핵심 테마와 드라이버를 중심으로 서술 (단순 수치 나열 금지)
- 해외(미국·유럽·일본) → 국내 채권 → 외환/크레딧 → 차주 전망·리스크 순서
- 정치·지정학 이슈가 있으면 시장 영향과 함께 반드시 포함
- 커브 형태 변화(스티프닝/플래트닝), 스프레드 동향 등 구체적 시장 구조 언급
- 차주 핵심 이벤트별 시나리오(예상치 상회/하회 시 시장 반응) 제시
- 3~4개 단락, 총 450~550자, 마크다운 없이 순수 텍스트, 단락 사이 빈 줄 하나`,
      messages: [{
        role: 'user',
        content: `다음 데이터를 바탕으로 이번 주(${snapshot.date} 기준) 주간 마켓리뷰의 '주간 총평' 섹션을 작성해주세요.\n\n${dataContext}${newsBlock(news)}`,
      }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ narrative: text })
  } catch (err) {
    console.error('[narrative/weekly]', err.message)
    res.status(500).json({ error: '주간 내러티브 생성에 실패했습니다.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/narrative/monthly
// ─────────────────────────────────────────────
app.post('/api/narrative/monthly', async (req, res) => {
  const { snapshot, targetMonth, geoContext } = req.body
  const { rates, fx, overseas } = snapshot

  const dataContext = `[월간 시장 데이터 — ${targetMonth || snapshot.date} 기준]

■ 주요 금리 (월말 기준)
- 기준금리: ${rates.baseRate}%
- 국고채 3Y: ${rates.ktb3y.value}% / 5Y: ${rates.ktb5y.value}% / 10Y: ${rates.ktb10y.value}%
- 장단기 스프레드(10Y-3Y): ${Math.round((rates.ktb10y.value - rates.ktb3y.value) * 100)}bp
- IRS 3Y: ${rates.irs3y.value}% / IRS 5Y: ${rates.irs5y.value}%
- 은행채 AAA 3Y: ${rates.bankBond3y.value}% (스프레드: ${Math.round((rates.bankBond3y.value - rates.ktb3y.value) * 100)}bp)
- 회사채 AA- 3Y: ${rates.corpAAMinus3y.value}% (스프레드: ${Math.round((rates.corpAAMinus3y.value - rates.ktb3y.value) * 100)}bp)
- 회사채 BBB- 3Y: ${rates.corpBBBMinus3y.value}%

■ 외환/해외 (월말 기준)
- USD/KRW: ${fx.usdKrw.value.toFixed(1)}원 / EUR/KRW: ${fx.eurKrw.value.toFixed(1)}원
- DXY: ${fx.dxy.value.toFixed(2)} / NDF 1M: ${fx.ndf1m.value.toFixed(1)}원
- 미 국채 2Y: ${overseas.ust2y.value}% / 10Y: ${overseas.ust10y.value}% / 30Y: ${overseas.ust30y.value}%
- SOFR: ${overseas.sofr.value}% / EURIBOR 3M: ${overseas.euribor3m.value}%
- KOSPI: ${overseas.kospi.value.toLocaleString()} / S&P500: ${overseas.sp500.value.toLocaleString()}
- VIX: ${overseas.vix.value.toFixed(1)} / WTI: $${overseas.wti.value.toFixed(1)} / 금: $${overseas.gold.value.toLocaleString()}
- 한국 CDS 5Y: ${overseas.koreaCds5y.value.toFixed(1)}bp
${geoBlock(geoContext)}`

  const news = await fetchRecentNews()
  try {
    const response = await getAnthropicClient(req).messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1600,
      system: `당신은 국내 시중은행 자금시장부의 수석 애널리스트입니다. 매월 이사회 및 임원진에게 배포하는 '월간 마켓리포트'의 핵심 서술 섹션을 작성합니다.

작성 원칙:
- 해당 월의 시장을 관통한 핵심 매크로 테마와 드라이버 중심 분석
- 국내 채권시장 → 외환시장 → 크레딧시장 → 글로벌 중앙은행 정책 순서
- 정치·지정학 이슈가 포함된 경우 시장 가격에 미친 영향 구체적 분석
- 섹션 마지막에 차월 전망 및 시사점 포함 (금리·환율 레인지 포함)
- 당행 자금운용 관점의 시사점(듀레이션, 크레딧 포지션, 헤지 전략 등) 포함
- 4~5개 단락, 총 550~700자, 마크다운 없이 순수 텍스트, 단락 사이 빈 줄`,
      messages: [{
        role: 'user',
        content: `다음 데이터를 바탕으로 ${targetMonth || snapshot.date} 기준 월간 마켓리포트의 '이달의 마켓 총평 & 차월 전망' 섹션을 작성해주세요.\n\n${dataContext}${newsBlock(news)}`,
      }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ narrative: text })
  } catch (err) {
    console.error('[narrative/monthly]', err.message)
    res.status(500).json({ error: '월간 내러티브 생성에 실패했습니다.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/narrative/adhoc
// ─────────────────────────────────────────────
const ADHOC_SYSTEM = {
  fomc: `당신은 연준(Fed) 정책 전문 채권 애널리스트입니다. FOMC 결과를 즉각 분석하여 국내 금융시장에 미치는 영향을 긴급 브리핑 형태로 작성합니다.
구성: ① FOMC 결과 요약 ② 시장 즉각 반응 (미 국채·달러·주가) ③ 국내 채권·외환 영향 분석 ④ 당행 포지션 시사점 ⑤ 다음 모니터링 포인트`,
  boc: `당신은 한국은행 통화정책 전문 애널리스트입니다. 금통위를 앞두고 결정 시나리오별 시장 영향을 분석하는 프리뷰 브리핑을 작성합니다.
구성: ① 동결/인하 시나리오 확률 및 근거 ② 시나리오별 시장 반응 전망 ③ 총재 기자회견 주목 포인트 ④ 당행 포지션 시사점`,
  shock: `당신은 시장 긴급 상황 분석 전문 애널리스트입니다. 시장 급변동 발생 시 원인과 파급 경로를 신속·정확하게 분석하는 긴급 코멘터리를 작성합니다.
구성: ① 급변동 원인 및 트리거 ② 국내외 시장 즉각 반응 ③ 파급 경로 및 리스크 ④ 당행 포지션 점검 사항 ⑤ 향후 안정화 조건`,
  rate: `당신은 채권시장 전문 애널리스트입니다. 금리 급등 사태 발생 시 원인 분석 및 방향성 전망 브리핑을 작성합니다.
구성: ① 금리 급등 배경 및 트리거 ② 커브 형태 변화 분석 ③ 외국인·기관 수급 동향 ④ 당행 듀레이션·포지션 시사점 ⑤ 단기 레인지 및 반전 조건`,
}

app.post('/api/narrative/adhoc', async (req, res) => {
  const { snapshot, templateType, topicDesc, geoContext } = req.body
  const { rates, fx, overseas } = snapshot

  const bp = v => (v > 0 ? `+${v}bp` : `${v}bp`)

  const dataContext = `[현재 시장 데이터 — ${snapshot.date}]
- 국고채 3Y: ${rates.ktb3y.value}% (${bp(rates.ktb3y.change)}) / 10Y: ${rates.ktb10y.value}% (${bp(rates.ktb10y.change)})
- IRS 3Y: ${rates.irs3y.value}% / 장단기 스프레드: ${Math.round((rates.ktb10y.value - rates.ktb3y.value) * 100)}bp
- USD/KRW: ${fx.usdKrw.value.toFixed(1)}원 / DXY: ${fx.dxy.value.toFixed(2)}
- 미 국채 2Y: ${overseas.ust2y.value}% / 10Y: ${overseas.ust10y.value}%
- KOSPI: ${overseas.kospi.value.toLocaleString()} / VIX: ${overseas.vix.value.toFixed(1)}
- 회사채 AA- 3Y: ${rates.corpAAMinus3y.value}% / 한국 CDS 5Y: ${overseas.koreaCds5y.value.toFixed(1)}bp
${geoBlock(geoContext)}`

  const systemPrompt = ADHOC_SYSTEM[templateType] || ADHOC_SYSTEM.shock
  const news = await fetchRecentNews()
  try {
    const response = await getAnthropicClient(req).messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1400,
      system: systemPrompt + '\n\n공통 원칙: 정치·지정학 이슈가 있으면 시장 영향과 함께 반드시 분석. 마크다운 없이 순수 텍스트. 섹션 제목은 【】로 표시. 총 600~800자.',
      messages: [{
        role: 'user',
        content: `브리핑 주제: ${topicDesc || '시장 긴급 분석'}\n\n${dataContext}${newsBlock(news)}\n위 상황에 대한 긴급 브리핑 초안을 작성해주세요.`,
      }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ narrative: text })
  } catch (err) {
    console.error('[narrative/adhoc]', err.message)
    res.status(500).json({ error: '수시 브리핑 생성에 실패했습니다.' })
  }
})

// ─────────────────────────────────────────────
// POST /api/narrative/daily
// ─────────────────────────────────────────────
function buildDataContext(snapshot, events) {
  const { rates, fx, overseas } = snapshot
  const bp  = (v) => (v > 0 ? `+${v}bp` : `${v}bp`)
  const chg = (v, d = 1) => (v > 0 ? `+${v.toFixed(d)}` : v.toFixed(d))
  const spread10y3y = Math.round((rates.ktb10y.value - rates.ktb3y.value) * 100)
  const spreadBank  = Math.round((rates.bankBond3y.value - rates.ktb3y.value) * 100)
  const spreadCorp  = Math.round((rates.corpAAMinus3y.value - rates.ktb3y.value) * 100)
  const ust2s10s    = Math.round((overseas.ust10y.value - overseas.ust2y.value) * 100)

  return `[시장 데이터 — ${snapshot.date}]

■ 국내 금리 (전일 대비)
- 기준금리: ${rates.baseRate}%
- 콜금리: ${rates.call.value}% (${bp(rates.call.change)})
- CD 91일: ${rates.cd91.value}% (${bp(rates.cd91.change)})
- CP 91일(A1): ${rates.cp91.value}% (${bp(rates.cp91.change)})
- 국고채 1Y: ${rates.ktb1y.value}% (${bp(rates.ktb1y.change)})
- 국고채 3Y: ${rates.ktb3y.value}% (${bp(rates.ktb3y.change)})
- 국고채 5Y: ${rates.ktb5y.value}% (${bp(rates.ktb5y.change)})
- 국고채 10Y: ${rates.ktb10y.value}% (${bp(rates.ktb10y.change)})
- 국고채 30Y: ${rates.ktb30y.value}% (${bp(rates.ktb30y.change)})
- 장단기 스프레드(10Y-3Y): ${spread10y3y}bp
- IRS 3Y: ${rates.irs3y.value}% (${bp(rates.irs3y.change)})
- IRS 5Y: ${rates.irs5y.value}% (${bp(rates.irs5y.change)})
- 은행채 AAA 3Y: ${rates.bankBond3y.value}% (${bp(rates.bankBond3y.change)}) / KTB 스프레드: ${spreadBank}bp
- 회사채 AA- 3Y: ${rates.corpAAMinus3y.value}% (${bp(rates.corpAAMinus3y.change)}) / KTB 스프레드: ${spreadCorp}bp

■ 외환
- USD/KRW: ${fx.usdKrw.value.toFixed(1)}원 (${chg(fx.usdKrw.change, 1)}원)
- EUR/KRW: ${fx.eurKrw.value.toFixed(1)}원 (${chg(fx.eurKrw.change, 1)}원)
- JPY/KRW(100): ${(fx.jpyKrw.value * 100).toFixed(2)}원 (${chg(fx.jpyKrw.change * 100, 2)}원)
- DXY: ${fx.dxy.value.toFixed(2)} (${chg(fx.dxy.change, 2)})
- NDF 1M: ${fx.ndf1m.value.toFixed(1)}원
- 스왑포인트 1M: ${fx.swapPt1m.value}pt / 3M: ${fx.swapPt3m.value}pt

■ 해외 시장
- 미 국채 2Y: ${overseas.ust2y.value}% (${bp(overseas.ust2y.change)})
- 미 국채 10Y: ${overseas.ust10y.value}% (${bp(overseas.ust10y.change)})
- 미 국채 30Y: ${overseas.ust30y.value}% (${bp(overseas.ust30y.change)})
- 미 국채 2s10s 스프레드: ${ust2s10s}bp
- SOFR: ${overseas.sofr.value}%
- EURIBOR 3M: ${overseas.euribor3m.value}% (${bp(overseas.euribor3m.change)})
- S&P500: ${overseas.sp500.value.toLocaleString()} (${chg(overseas.sp500.change, 2)}%)
- KOSPI: ${overseas.kospi.value.toLocaleString()} (${chg(overseas.kospi.change, 2)}%)
- VIX: ${overseas.vix.value.toFixed(1)} (${chg(overseas.vix.change, 1)})
- WTI: $${overseas.wti.value.toFixed(1)} (${chg(overseas.wti.change, 2)})
- 금: $${overseas.gold.value.toLocaleString()} (${chg(overseas.gold.change, 0)})
- 한국 CDS 5Y: ${overseas.koreaCds5y.value.toFixed(1)}bp (${chg(overseas.koreaCds5y.change, 1)})

■ 금일 주요 일정
${events.map(e =>
  `- ${e.time} [${e.country}] ${e.event} (이전: ${e.previous}, 예상: ${e.forecast}${e.actual ? `, 실제: ${e.actual}` : ''})`
).join('\n')}`
}

app.post('/api/narrative/daily', async (req, res) => {
  const { snapshot, events } = req.body
  const dataContext = buildDataContext(snapshot, events)
  const news = await fetchRecentNews()

  try {
    const response = await getAnthropicClient(req).messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `당신은 국내 시중은행 자금시장부의 시니어 채권·외환 애널리스트입니다. 매일 아침 임원 및 딜러들에게 배포하는 '자금시장 모닝브리프'의 마켓 총평을 작성합니다.

작성 원칙:
- 해외 채권시장 → 달러/외환 → 국내 채권시장 → 금일 주요 이슈 순서로 서술
- 단순 수치 나열이 아닌, 데이터 간 인과관계와 시장에 미치는 영향을 해석하여 서술
- 전문적이고 간결한 금융 용어 사용 (bp, 스프레드, 커브 스티프닝/플래트닝, 베어/불 등)
- 불확실성과 리스크 요인을 명시하고 금일 주목해야 할 레인지 또는 포인트를 제시
- 뉴스 헤드라인이 제공된 경우 시장에 영향을 주는 주요 이슈를 총평에 반영할 것
- 4개 단락 구성, 각 단락 3~4문장, 총 400~500자 수준
- 마크다운 기호(**, ##, - 등) 없이 순수 텍스트로만 출력
- 각 단락 사이에 빈 줄 하나 삽입`,
      messages: [{
        role: 'user',
        content: `다음 시장 데이터를 바탕으로 오늘(${snapshot.date}) 자금시장 모닝브리프의 '마켓 총평' 섹션을 작성해주세요.\n\n${dataContext}${newsBlock(news)}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ narrative: text })
  } catch (err) {
    console.error('[narrative] error:', err.message)
    res.status(500).json({ error: '내러티브 생성에 실패했습니다.' })
  }
})

// ─────────────────────────────────────────────
// GET /api/setup/status — 현재 키 설정 상태
// ─────────────────────────────────────────────
app.get('/api/setup/status', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    ecos:      !!process.env.ECOS_API_KEY,
    fred:      !!process.env.FRED_API_KEY,
    smtp:      !!process.env.SMTP_HOST,
  })
})

// ─────────────────────────────────────────────
// POST /api/setup/save — .env 업데이트 + 런타임 키 교체
// ─────────────────────────────────────────────
app.post('/api/setup/save', async (req, res) => {
  const { anthropicKey, ecosKey, fredKey, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom } = req.body

  const get = (newVal, envKey) => (newVal?.trim() || process.env[envKey] || '')

  const lines = [
    `ANTHROPIC_API_KEY=${get(anthropicKey, 'ANTHROPIC_API_KEY')}`,
    `ECOS_API_KEY=${get(ecosKey, 'ECOS_API_KEY')}`,
    `FRED_API_KEY=${get(fredKey, 'FRED_API_KEY')}`,
    `PORT=${process.env.PORT || 3001}`,
  ]

  const newSmtpHost = get(smtpHost, 'SMTP_HOST')
  if (newSmtpHost) {
    lines.push('', `SMTP_HOST=${newSmtpHost}`)
    lines.push(`SMTP_PORT=${get(smtpPort, 'SMTP_PORT') || 587}`)
    lines.push(`SMTP_SECURE=${get(smtpSecure, 'SMTP_SECURE') || 'false'}`)
    lines.push(`SMTP_USER=${get(smtpUser, 'SMTP_USER')}`)
    lines.push(`SMTP_PASS=${get(smtpPass, 'SMTP_PASS')}`)
    const from = get(smtpFrom, 'SMTP_FROM')
    if (from) lines.push(`SMTP_FROM=${from}`)
  }

  try {
    await fs.writeFile(path.join(__dirname, '.env'), lines.join('\n') + '\n')

    // 런타임 즉시 반영 (ANTHROPIC_API_KEY는 요청별 x-api-key 헤더로 처리)
    if (anthropicKey?.trim()) {
      process.env.ANTHROPIC_API_KEY = anthropicKey.trim()
    }
    if (ecosKey?.trim())  { process.env.ECOS_API_KEY = ecosKey.trim();  ECOS_KEY = ecosKey.trim() }
    if (fredKey?.trim())  { process.env.FRED_API_KEY = fredKey.trim();  FRED_KEY = fredKey.trim() }
    if (smtpHost?.trim()) process.env.SMTP_HOST = smtpHost.trim()
    if (smtpPort?.trim()) process.env.SMTP_PORT = smtpPort.trim()
    if (smtpUser?.trim()) process.env.SMTP_USER = smtpUser.trim()
    if (smtpPass?.trim()) process.env.SMTP_PASS = smtpPass.trim()
    if (smtpFrom?.trim()) process.env.SMTP_FROM = smtpFrom.trim()

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/reports — 리포트 목록
// ─────────────────────────────────────────────
app.get('/api/reports', (req, res) => {
  res.json([...reportIndex].reverse())
})

// ─────────────────────────────────────────────
// POST /api/reports — PDF 저장 + 메타데이터 기록
// ─────────────────────────────────────────────
app.post('/api/reports', async (req, res) => {
  const { meta, pdfBase64 } = req.body
  if (!meta || !pdfBase64) return res.status(400).json({ error: '필수 파라미터 누락' })

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const raw = pdfBase64.replace(/^data:[^;]+;base64,/, '')
  const buf = Buffer.from(raw, 'base64')
  await fs.writeFile(path.join(DATA_DIR, `${id}.pdf`), buf)

  const entry = {
    id,
    type:           meta.type,
    title:          meta.title,
    date:           meta.date,
    author:         meta.author,
    classification: meta.classification,
    createdAt:      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  }
  reportIndex.push(entry)
  await persistIndex()
  res.json({ id })
})

// ─────────────────────────────────────────────
// GET /api/reports/:id/pdf — PDF 파일 서빙
// ─────────────────────────────────────────────
app.get('/api/reports/:id/pdf', async (req, res) => {
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, `${req.params.id}.pdf`))
    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `inline; filename="${req.params.id}.pdf"`)
    res.send(buf)
  } catch {
    res.status(404).json({ error: '파일을 찾을 수 없습니다.' })
  }
})

// ─────────────────────────────────────────────
// DELETE /api/reports/:id — 리포트 삭제
// ─────────────────────────────────────────────
app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params
  try { await fs.unlink(path.join(DATA_DIR, `${id}.pdf`)) } catch { /* 파일 없어도 무시 */ }
  reportIndex = reportIndex.filter(r => r.id !== id)
  await persistIndex()
  res.json({ ok: true })
})

// ─────────────────────────────────────────────
// POST /api/reports/email — nodemailer 이메일 발송
// ─────────────────────────────────────────────
app.post('/api/reports/email', async (req, res) => {
  const { pdfBase64, meta, recipients, subject } = req.body
  if (!recipients?.length) return res.status(400).json({ error: '수신자가 없습니다.' })

  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(503).json({ error: 'SMTP 설정이 필요합니다. (.env SMTP_HOST/USER/PASS)' })
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: smtpUser, pass: smtpPass },
  })

  const raw = pdfBase64.replace(/^data:[^;]+;base64,/, '')
  const buf = Buffer.from(raw, 'base64')

  try {
    await transporter.sendMail({
      from:    process.env.SMTP_FROM || smtpUser,
      to:      recipients.join(', '),
      subject,
      text:    `${meta.title} 리포트를 첨부합니다.\n\n기준일: ${meta.date}\n작성자: ${meta.author}\n문서등급: ${meta.classification}`,
      attachments: [{
        filename:    `${meta.type}-${meta.date}.pdf`,
        content:     buf,
        contentType: 'application/pdf',
      }],
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('[email]', e.message)
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
