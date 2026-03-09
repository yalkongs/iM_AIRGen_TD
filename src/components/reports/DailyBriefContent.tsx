import YieldCurveChart from '../charts/YieldCurveChart'
import RateHistoryChart from '../charts/RateHistoryChart'
import FXChart from '../charts/FXChart'
import { todayEvents } from '../../utils/mockData'
import { getActiveSnapshot, getActiveHistory, buildYieldCurveFromData } from '../../utils/marketStore'
import type { ReportSection } from '../../types'

const s = getActiveSnapshot()
const history = getActiveHistory()
const yieldCurve = buildYieldCurveFromData(s, history)
const fmt = (v: number, d = 2) => v.toFixed(d)
const chg = (v: number, d = 1) =>
  v > 0 ? <span className="val-up">▲{v.toFixed(d)}</span>
  : v < 0 ? <span className="val-down">▼{Math.abs(v).toFixed(d)}</span>
  : <span className="val-flat">-</span>
const bpChg = (v: number) =>
  v > 0 ? <span className="val-up">+{v}bp</span>
  : v < 0 ? <span className="val-down">{v}bp</span>
  : <span className="val-flat">-</span>

const IMPORTANCE_LABEL: Record<string, string> = { high: '●', medium: '◐', low: '○' }
const COUNTRY_FLAG: Record<string, string> = { KR: '🇰🇷', US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳' }

interface Props {
  sections: ReportSection[]
  date: string
  classification: string
  author: string
  customNote: string
  narrative: string
  narrativeLoading?: boolean
}

export default function DailyBriefContent({ sections, date, classification, author, customNote, narrative, narrativeLoading }: Props) {
  const enabled = (id: string) => sections.find(s => s.id === id)?.enabled !== false

  return (
    <>
      {/* ── 헤더 ── */}
      <div style={{ borderBottom: '2px solid #0d1b3e', paddingBottom: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
              iMBank Trading Desk
            </div>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: '#0d1b3e', lineHeight: 1.2 }}>
              자금시장 모닝브리프
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#0d1b3e' }}>
              {date.replace(/-/g, '.')} (금)
            </div>
            <div style={{
              display: 'inline-block', marginTop: 4,
              background: classification === '비밀' ? '#dc2626' : classification === '대외비' ? '#d97706' : '#0d1b3e',
              color: 'white', fontSize: '7pt', fontWeight: 700,
              padding: '2px 8px', borderRadius: 2, letterSpacing: 1,
            }}>
              {classification}
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(to right, #0d1b3e, #c9a227)', marginTop: 8, borderRadius: 2 }} />
      </div>

      {/* ── 마켓 총평 ── */}
      {enabled('summary') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 오늘의 마켓 총평</h2>
          <div style={{
            background: narrativeLoading ? '#f1f5f9' : '#f8fafc',
            borderLeft: '3px solid #c9a227',
            padding: '8px 12px', fontSize: '9pt', lineHeight: 1.7,
            whiteSpace: 'pre-line', color: narrativeLoading ? '#94a3b8' : '#1e293b',
            minHeight: 60,
          }}>
            {narrativeLoading ? 'AI 총평 생성 중...' : narrative || '좌측 패널에서 [AI 총평 생성] 버튼을 눌러주세요.'}
          </div>
        </div>
      )}

      {/* ── 주요 시장 지표 ── */}
      {(enabled('rateTable') || enabled('fxTable')) && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 주요 시장 지표</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* 국내 금리 */}
            {enabled('rateTable') && (
              <div>
                <h3 style={{ marginBottom: 4, color: '#475569', fontSize: '8pt' }}>▸ 국내 금리 (%, bp)</h3>
                <table>
                  <thead>
                    <tr><th style={{ textAlign: 'left' }}>구분</th><th>현재</th><th>전일대비</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>기준금리</td><td>{fmt(s.rates.baseRate)}</td><td><span className="val-flat">-</span></td></tr>
                    <tr><td>콜금리(익오버)</td><td>{fmt(s.rates.call.value)}</td><td>{bpChg(s.rates.call.change)}</td></tr>
                    <tr><td>CD 91일</td><td>{fmt(s.rates.cd91.value)}</td><td>{bpChg(s.rates.cd91.change)}</td></tr>
                    <tr><td>CP 91일(A1)</td><td>{fmt(s.rates.cp91.value)}</td><td>{bpChg(s.rates.cp91.change)}</td></tr>
                    <tr><td>국고채 3Y</td><td>{fmt(s.rates.ktb3y.value)}</td><td>{bpChg(s.rates.ktb3y.change)}</td></tr>
                    <tr><td>국고채 5Y</td><td>{fmt(s.rates.ktb5y.value)}</td><td>{bpChg(s.rates.ktb5y.change)}</td></tr>
                    <tr><td>국고채 10Y</td><td>{fmt(s.rates.ktb10y.value)}</td><td>{bpChg(s.rates.ktb10y.change)}</td></tr>
                    <tr><td>국고채 30Y</td><td>{fmt(s.rates.ktb30y.value)}</td><td>{bpChg(s.rates.ktb30y.change)}</td></tr>
                    <tr><td>은행채 AAA 3Y</td><td>{fmt(s.rates.bankBond3y.value)}</td><td>{bpChg(s.rates.bankBond3y.change)}</td></tr>
                    <tr><td>회사채 AA- 3Y</td><td>{fmt(s.rates.corpAAMinus3y.value)}</td><td>{bpChg(s.rates.corpAAMinus3y.change)}</td></tr>
                    <tr><td>IRS 3Y</td><td>{fmt(s.rates.irs3y.value)}</td><td>{bpChg(s.rates.irs3y.change)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 외환/해외 */}
            {enabled('fxTable') && (
              <div>
                <h3 style={{ marginBottom: 4, color: '#475569', fontSize: '8pt' }}>▸ 외환 & 해외 금리</h3>
                <table>
                  <thead>
                    <tr><th style={{ textAlign: 'left' }}>구분</th><th>현재</th><th>전일대비</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>USD/KRW</td><td>{fmt(s.fx.usdKrw.value, 1)}</td><td>{chg(s.fx.usdKrw.change, 1)}</td></tr>
                    <tr><td>EUR/KRW</td><td>{fmt(s.fx.eurKrw.value, 1)}</td><td>{chg(s.fx.eurKrw.change, 1)}</td></tr>
                    <tr><td>JPY/KRW(100)</td><td>{fmt(s.fx.jpyKrw.value * 100, 1)}</td><td>{chg(s.fx.jpyKrw.change * 100, 1)}</td></tr>
                    <tr><td>DXY</td><td>{fmt(s.fx.dxy.value, 2)}</td><td>{chg(s.fx.dxy.change, 2)}</td></tr>
                    <tr><td>NDF 1M</td><td>{fmt(s.fx.ndf1m.value, 1)}</td><td>{chg(s.fx.ndf1m.change, 1)}</td></tr>
                    <tr><td>미 국채 2Y(%)</td><td>{fmt(s.overseas.ust2y.value)}</td><td>{bpChg(s.overseas.ust2y.change)}</td></tr>
                    <tr><td>미 국채 10Y(%)</td><td>{fmt(s.overseas.ust10y.value)}</td><td>{bpChg(s.overseas.ust10y.change)}</td></tr>
                    <tr><td>SOFR</td><td>{fmt(s.overseas.sofr.value)}</td><td>{bpChg(s.overseas.sofr.change)}</td></tr>
                    <tr><td>KOSPI</td><td>{s.overseas.kospi.value.toLocaleString()}</td><td>{chg(s.overseas.kospi.change)}</td></tr>
                    <tr><td>VIX</td><td>{fmt(s.overseas.vix.value, 1)}</td><td>{chg(s.overseas.vix.change, 1)}</td></tr>
                    <tr><td>한국 CDS 5Y(bp)</td><td>{fmt(s.overseas.koreaCds5y.value, 1)}</td><td>{chg(s.overseas.koreaCds5y.change, 1)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 차트 ── */}
      {(enabled('yieldCurve') || enabled('rateChart')) && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 금리 동향 차트</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {enabled('yieldCurve') && (
              <div>
                <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 수익률곡선 (오늘·1주·1개월)</h3>
                <YieldCurveChart data={yieldCurve} compact />
                <div style={{ fontSize: '7pt', color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                  ― 오늘 &nbsp;·· 1주전 &nbsp;-- 1개월전
                </div>
              </div>
            )}
            {enabled('rateChart') && (
              <div>
                <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 국고채 금리 추이 (20영업일)</h3>
                <RateHistoryChart ktb3y={history.ktb3y} ktb10y={history.ktb10y} compact />
                <div style={{ fontSize: '7pt', color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                  ― 국고3Y &nbsp;― 국고10Y
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FX 차트 ── */}
      {enabled('fxChart') && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ USD/KRW 추이 (20영업일)</h3>
              <FXChart data={history.usdKrw} compact color="#1e3a6e" label="USD/KRW" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 미 국채 10Y 추이 (20영업일)</h3>
              <FXChart data={history.ust10y} compact color="#dc2626" label="UST 10Y" />
            </div>
          </div>
        </div>
      )}

      {/* ── 해외 동향 ── */}
      {enabled('overseas') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 해외 주요 동향</h2>
          <ul style={{ paddingLeft: 14, fontSize: '9pt', lineHeight: 1.8 }}>
            <li><b>미국:</b> 전일 ISM 서비스업 PMI 53.5 (컨센서스 52.8 상회) → 연준 금리인하 기대 약화. 10년물 4.68%(+4bp). SOFR 선물은 6월 인하 확률 52%로 하락.</li>
            <li><b>유럽:</b> ECB 라가르드 총재, 인플레이션의 목표 수렴 경로 확인하나 추가 인하에 신중. 독일 10년 분트 2.78%(-1bp).</li>
            <li><b>일본:</b> 닛케이 38,500(+1.2%). BOJ 3월 금리인상 전망 강화. JPY 147/USD.</li>
            <li><b>원자재:</b> WTI {fmt(s.overseas.wti.value, 1)}달러(+{fmt(s.overseas.wti.change, 2)}). 금 {s.overseas.gold.value.toLocaleString()}달러(+{s.overseas.gold.change}).</li>
          </ul>
        </div>
      )}

      {/* ── 금일 주요 일정 ── */}
      {enabled('calendar') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 금일 주요 일정</h2>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: '10%' }}>시간</th>
                <th style={{ textAlign: 'left', width: '8%' }}>국가</th>
                <th style={{ textAlign: 'left', width: '40%' }}>이벤트</th>
                <th>이전치</th><th>예상치</th><th>실제</th>
              </tr>
            </thead>
            <tbody>
              {todayEvents.map((ev, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left' }}>{ev.time}</td>
                  <td style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '8pt' }}>{COUNTRY_FLAG[ev.country]} {ev.country}</span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    {IMPORTANCE_LABEL[ev.importance]} {ev.event}
                  </td>
                  <td>{ev.previous}</td>
                  <td>{ev.forecast}</td>
                  <td style={{ fontWeight: ev.actual ? 600 : 400 }}>{ev.actual || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 커스텀 메모 ── */}
      {customNote && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 추가 코멘트</h2>
          <div style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', padding: '8px 12px', fontSize: '9pt', lineHeight: 1.7 }}>
            {customNote}
          </div>
        </div>
      )}

      {/* ── 푸터 ── */}
      <div style={{
        position: 'absolute', bottom: 40, left: 72, right: 72,
        borderTop: '1px solid #e2e8f0', paddingTop: 8,
        display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#94a3b8',
      }}>
        <div>
          <div>데이터 출처: ECOS(한국은행) · FRED(미 연준) · Yahoo Finance | {date} 기준</div>
          <div>본 자료는 내부 참고용이며 외부 배포를 금합니다.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>작성: {author} | 자금시장부</div>
          <div>배포: 본부장, 부행장, 자금시장부 전체</div>
        </div>
      </div>
    </>
  )
}
