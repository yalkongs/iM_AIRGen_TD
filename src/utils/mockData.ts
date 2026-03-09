import type { MarketSnapshot, MarketHistory, YieldCurvePoint, EconomicEvent, HistoryPoint } from '../types'

// 재현 가능한 시드 기반 난수 생성기
class SeededRandom {
  private s: number
  constructor(seed: number) { this.s = seed }
  next(): number {
    this.s = (this.s * 1103515245 + 12345) & 0x7fffffff
    return this.s / 0x7fffffff
  }
}

function genHistory(base: number, vol: number, seed: number, days = 20): HistoryPoint[] {
  const rng = new SeededRandom(seed)
  const result: HistoryPoint[] = []
  let v = base
  // 오늘로부터 역산해서 날짜 생성
  const dates: string[] = []
  const today = new Date(2026, 2, 6)
  let d = new Date(today)
  d.setDate(d.getDate() - 30)
  while (dates.length < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${mm}/${dd}`)
  }
  for (const date of dates) {
    const chg = (rng.next() - 0.49) * vol
    v = Math.round((v + chg) * 1000) / 1000
    result.push({ date, value: v })
  }
  return result
}

// ─── 현재 스냅샷 (2026-03-06) ───
export const snapshot: MarketSnapshot = {
  date: '2026-03-06',
  rates: {
    baseRate: 3.00,
    call:          { value: 3.02,  change:  1  },
    cd91:          { value: 3.45,  change:  0  },
    cp91:          { value: 3.62,  change:  2  },
    rp7:           { value: 3.30,  change:  0  },
    ktb1y:         { value: 3.15,  change:  1  },
    ktb2y:         { value: 3.20,  change:  2  },
    ktb3y:         { value: 3.25,  change:  2  },
    ktb5y:         { value: 3.35,  change:  3  },
    ktb10y:        { value: 3.52,  change:  3  },
    ktb20y:        { value: 3.55,  change:  2  },
    ktb30y:        { value: 3.50,  change:  1  },
    irs1y:         { value: 3.30,  change:  2  },
    irs3y:         { value: 3.42,  change:  3  },
    irs5y:         { value: 3.55,  change:  3  },
    bankBond3y:    { value: 3.45,  change:  2  },
    corpAAMinus3y: { value: 3.88,  change:  3  },
    corpBBBMinus3y:{ value: 5.92,  change:  5  },
  },
  fx: {
    usdKrw:  { value: 1320.50, change:  -5.2  },
    eurKrw:  { value: 1450.20, change:   8.3  },
    jpyKrw:  { value: 8.95,   change:   0.12 },
    cnhKrw:  { value: 182.50, change:  -1.20 },
    dxy:     { value: 103.52, change:   0.35 },
    ndf1m:   { value: 1321.50, change: -4.8  },
    swapPt1m:{ value: -3.5,   change:  0.2  },
    swapPt3m:{ value: -10.8,  change:  0.5  },
  },
  overseas: {
    ust2y:      { value: 4.52,  change:  5  },
    ust10y:     { value: 4.68,  change:  4  },
    ust30y:     { value: 4.85,  change:  3  },
    sofr:       { value: 5.30,  change:  0  },
    euribor3m:  { value: 3.85,  change: -2  },
    sp500:      { value: 5750,  change:  0.3  },
    kospi:      { value: 2580.45, change: 0.8 },
    nasdaq:     { value: 18200, change:  0.5  },
    nikkei:     { value: 38500, change:  1.2  },
    vix:        { value: 18.5,  change: -0.8  },
    wti:        { value: 72.50, change:  0.52 },
    gold:       { value: 2050,  change: 12    },
    koreaCds5y: { value: 48.5,  change: -0.8  },
  }
}

// ─── 히스토리 (20영업일) ───
export const history: MarketHistory = {
  ktb3y:      genHistory(3.18, 0.025, 101),
  ktb10y:     genHistory(3.42, 0.030, 202),
  usdKrw:     genHistory(1310, 8,     303),
  ust10y:     genHistory(4.55, 0.040, 404),
  corpSpread: genHistory(63,   2,     505), // bp
}
// 마지막 포인트를 오늘 값으로 보정
history.ktb3y[history.ktb3y.length - 1]   = { date: '03/06', value: 3.25 }
history.ktb10y[history.ktb10y.length - 1] = { date: '03/06', value: 3.52 }
history.usdKrw[history.usdKrw.length - 1] = { date: '03/06', value: 1320.5 }
history.ust10y[history.ust10y.length - 1] = { date: '03/06', value: 4.68 }
history.corpSpread[history.corpSpread.length - 1] = { date: '03/06', value: 63 }

// ─── 수익률 곡선 ───
export const yieldCurve: YieldCurvePoint[] = [
  { tenor: '1Y',  today: 3.15, weekAgo: 3.12, monthAgo: 3.08 },
  { tenor: '2Y',  today: 3.20, weekAgo: 3.17, monthAgo: 3.10 },
  { tenor: '3Y',  today: 3.25, weekAgo: 3.21, monthAgo: 3.12 },
  { tenor: '5Y',  today: 3.35, weekAgo: 3.30, monthAgo: 3.20 },
  { tenor: '10Y', today: 3.52, weekAgo: 3.45, monthAgo: 3.30 },
  { tenor: '20Y', today: 3.55, weekAgo: 3.48, monthAgo: 3.32 },
  { tenor: '30Y', today: 3.50, weekAgo: 3.44, monthAgo: 3.28 },
]

// ─── 경제 이벤트 (오늘) ───
export const todayEvents: EconomicEvent[] = [
  { time: '08:00', country: 'KR', event: '소비자물가지수 (2월)', previous: '2.2%', forecast: '2.3%', actual: '2.4%', importance: 'high' },
  { time: '09:00', country: 'KR', event: '외환보유액 (2월)', previous: '$4,156억', forecast: '-', importance: 'medium' },
  { time: '15:00', country: 'EU', event: 'ECB 총재 연설', previous: '-', forecast: '-', importance: 'high' },
  { time: '22:30', country: 'US', event: '비농업부문 고용 (2월)', previous: '25.6만', forecast: '19.0만', importance: 'high' },
  { time: '22:30', country: 'US', event: '실업률 (2월)', previous: '4.0%', forecast: '4.0%', importance: 'high' },
  { time: '00:00', country: 'US', event: '미시간대 소비자심리 (3월P)', previous: '64.7', forecast: '63.2', importance: 'medium' },
]

// ─── 이번 주 주요 일정 ───
export const weekEvents: EconomicEvent[] = [
  { time: '03/04', country: 'US', event: 'ISM 서비스업 PMI', previous: '52.8', forecast: '53.0', actual: '53.5', importance: 'high' },
  { time: '03/05', country: 'KR', event: '금통위 의사록 공개', previous: '-', forecast: '-', actual: '공개됨', importance: 'high' },
  { time: '03/06', country: 'KR', event: 'CPI (2월)', previous: '2.2%', forecast: '2.3%', actual: '2.4%', importance: 'high' },
  { time: '03/06', country: 'US', event: 'NFP (2월)', previous: '25.6만', forecast: '19.0만', importance: 'high' },
  { time: '03/11', country: 'US', event: 'CPI (2월)', previous: '3.0%', forecast: '2.9%', importance: 'high' },
  { time: '03/12', country: 'US', event: 'PPI (2월)', previous: '3.5%', forecast: '3.3%', importance: 'medium' },
  { time: '03/19', country: 'US', event: 'FOMC 회의 결과', previous: '5.25~5.50%', forecast: '동결', importance: 'high' },
  { time: '03/26', country: 'KR', event: '금융통화위원회', previous: '3.00%', forecast: '동결', importance: 'high' },
]

// ─── 저장된 리포트 목록 (아카이브 목업) ───
export const savedReports = [
  { id: '1',  date: '2026-03-06', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.03.06)', createdAt: '07:28', author: '김철수' },
  { id: '2',  date: '2026-03-05', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.03.05)', createdAt: '07:31', author: '김철수' },
  { id: '3',  date: '2026-03-04', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.03.04)', createdAt: '07:25', author: '이영희' },
  { id: '4',  date: '2026-03-03', type: 'weekly'  as const, title: '주간 마켓리뷰 (2026년 제10주)', createdAt: '08:05', author: '이영희' },
  { id: '5',  date: '2026-03-03', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.03.03)', createdAt: '07:29', author: '김철수' },
  { id: '6',  date: '2026-02-28', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.02.28)', createdAt: '07:33', author: '박민준' },
  { id: '7',  date: '2026-02-28', type: 'adhoc'   as const, title: '[긴급] 한은 총재 발언 관련 시장 영향 분석', createdAt: '11:42', author: '이영희' },
  { id: '8',  date: '2026-02-27', type: 'daily'   as const, title: '자금시장 모닝브리프 (2026.02.27)', createdAt: '07:30', author: '김철수' },
  { id: '9',  date: '2026-02-03', type: 'monthly' as const, title: '월간 마켓리포트 (2026년 1월)', createdAt: '09:15', author: '박민준' },
  { id: '10', date: '2026-01-03', type: 'monthly' as const, title: '월간 마켓리포트 (2025년 12월)', createdAt: '09:22', author: '박민준' },
]
