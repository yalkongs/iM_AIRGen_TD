import type { MarketSnapshot, MarketHistory, RateItem } from '../types'
import { snapshot as mockSnapshot, history as mockHistory } from './mockData'

const SNAPSHOT_KEY = 'mkt-desk:snapshot'
const MANUAL_KEY   = 'mkt-desk:manual'
const HISTORY_KEY  = 'mkt-desk:history'

// ─── 수동 입력 필드 (API에서 제공되지 않는 항목) ───────────────────────────
export interface ManualFields {
  rp7:           RateItem
  irs1y:         RateItem
  irs3y:         RateItem
  irs5y:         RateItem
  bankBond3y:    RateItem
  corpAAMinus3y: RateItem
  corpBBBMinus3y:RateItem
  ndf1m:         RateItem
  swapPt1m:      RateItem
  swapPt3m:      RateItem
  euribor3m:     RateItem
  koreaCds5y:    RateItem
}

export const DEFAULT_MANUAL: ManualFields = {
  rp7:            { value: mockSnapshot.rates.rp7.value,            change: mockSnapshot.rates.rp7.change },
  irs1y:          { value: mockSnapshot.rates.irs1y.value,          change: mockSnapshot.rates.irs1y.change },
  irs3y:          { value: mockSnapshot.rates.irs3y.value,          change: mockSnapshot.rates.irs3y.change },
  irs5y:          { value: mockSnapshot.rates.irs5y.value,          change: mockSnapshot.rates.irs5y.change },
  bankBond3y:     { value: mockSnapshot.rates.bankBond3y.value,     change: mockSnapshot.rates.bankBond3y.change },
  corpAAMinus3y:  { value: mockSnapshot.rates.corpAAMinus3y.value,  change: mockSnapshot.rates.corpAAMinus3y.change },
  corpBBBMinus3y: { value: mockSnapshot.rates.corpBBBMinus3y.value, change: mockSnapshot.rates.corpBBBMinus3y.change },
  ndf1m:          { value: mockSnapshot.fx.ndf1m.value,             change: mockSnapshot.fx.ndf1m.change },
  swapPt1m:       { value: mockSnapshot.fx.swapPt1m.value,          change: mockSnapshot.fx.swapPt1m.change },
  swapPt3m:       { value: mockSnapshot.fx.swapPt3m.value,          change: mockSnapshot.fx.swapPt3m.change },
  euribor3m:      { value: mockSnapshot.overseas.euribor3m.value,   change: mockSnapshot.overseas.euribor3m.change },
  koreaCds5y:     { value: mockSnapshot.overseas.koreaCds5y.value,  change: mockSnapshot.overseas.koreaCds5y.change },
}

// ─── API 응답 타입 ──────────────────────────────────────────────────────────
export interface FetchedMarketData {
  ecosData: {
    date?: string
    baseRate?: number | null
    call?:   RateItem | null
    cd91?:   RateItem | null
    cp91?:   RateItem | null
    ktb1y?:  RateItem | null
    ktb2y?:  RateItem | null
    ktb3y?:  RateItem | null
    ktb5y?:  RateItem | null
    ktb10y?: RateItem | null
    ktb20y?: RateItem | null
    ktb30y?: RateItem | null
    usdKrw?: RateItem | null
  }
  fredData: {
    ust2y?:  RateItem | null
    ust10y?: RateItem | null
    ust30y?: RateItem | null
    sofr?:   RateItem | null
  }
  yahooData: {
    eurKrw?: RateItem | null
    jpyKrw?: RateItem | null
    cnhKrw?: RateItem | null
    dxy?:    RateItem | null
    sp500?:  RateItem | null
    nasdaq?: RateItem | null
    kospi?:  RateItem | null
    nikkei?: RateItem | null
    vix?:    RateItem | null
    wti?:    RateItem | null
    gold?:   RateItem | null
  }
  historyData?: {
    ktb3y?:  { date: string; value: number }[]
    ktb10y?: { date: string; value: number }[]
    usdKrw?: { date: string; value: number }[]
    ust10y?: { date: string; value: number }[]
  }
  status: { ecos: string; fred: string; yahoo: string }
  errors: string[]
}

// ─── API 데이터 + 수동 입력 → MarketSnapshot 변환 ──────────────────────────
export function buildSnapshot(fetched: FetchedMarketData, manual: ManualFields): MarketSnapshot {
  const e = fetched.ecosData
  const f = fetched.fredData
  const y = fetched.yahooData
  const m = mockSnapshot  // fallback

  const or = <T,>(v: T | null | undefined, fb: T): T => (v != null ? v : fb)

  return {
    date: e.date || m.date,
    rates: {
      baseRate:       or(e.baseRate, m.rates.baseRate),
      call:           or(e.call,     m.rates.call),
      cd91:           or(e.cd91,     m.rates.cd91),
      cp91:           or(e.cp91,     m.rates.cp91),
      rp7:            manual.rp7,
      ktb1y:          or(e.ktb1y,   m.rates.ktb1y),
      ktb2y:          or(e.ktb2y,   m.rates.ktb2y),
      ktb3y:          or(e.ktb3y,   m.rates.ktb3y),
      ktb5y:          or(e.ktb5y,   m.rates.ktb5y),
      ktb10y:         or(e.ktb10y,  m.rates.ktb10y),
      ktb20y:         or(e.ktb20y,  m.rates.ktb20y),
      ktb30y:         or(e.ktb30y,  m.rates.ktb30y),
      irs1y:          manual.irs1y,
      irs3y:          manual.irs3y,
      irs5y:          manual.irs5y,
      bankBond3y:     manual.bankBond3y,
      corpAAMinus3y:  manual.corpAAMinus3y,
      corpBBBMinus3y: manual.corpBBBMinus3y,
    },
    fx: {
      usdKrw:   or(e.usdKrw,  m.fx.usdKrw),
      eurKrw:   or(y.eurKrw,  m.fx.eurKrw),
      jpyKrw:   or(y.jpyKrw,  m.fx.jpyKrw),
      cnhKrw:   or(y.cnhKrw,  m.fx.cnhKrw),
      dxy:      or(y.dxy,     m.fx.dxy),
      ndf1m:    manual.ndf1m,
      swapPt1m: manual.swapPt1m,
      swapPt3m: manual.swapPt3m,
    },
    overseas: {
      ust2y:      or(f.ust2y,  m.overseas.ust2y),
      ust10y:     or(f.ust10y, m.overseas.ust10y),
      ust30y:     or(f.ust30y, m.overseas.ust30y),
      sofr:       or(f.sofr,   m.overseas.sofr),
      euribor3m:  manual.euribor3m,
      sp500:      or(y.sp500,  m.overseas.sp500),
      kospi:      or(y.kospi,  m.overseas.kospi),
      nasdaq:     or(y.nasdaq, m.overseas.nasdaq),
      nikkei:     or(y.nikkei, m.overseas.nikkei),
      vix:        or(y.vix,    m.overseas.vix),
      wti:        or(y.wti,    m.overseas.wti),
      gold:       or(y.gold,   m.overseas.gold),
      koreaCds5y: manual.koreaCds5y,
    },
  }
}

// ─── localStorage 저장/조회 ─────────────────────────────────────────────────
export function getStoredSnapshot(): MarketSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveSnapshot(s: MarketSnapshot) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s))
}

export function getActiveSnapshot(): MarketSnapshot {
  return getStoredSnapshot() ?? mockSnapshot
}

export function getStoredHistory(): MarketHistory | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveHistory(h: Partial<MarketHistory>) {
  const existing = getStoredHistory() ?? {}
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ ...existing, ...h }))
}

export function getActiveHistory(): MarketHistory {
  return getStoredHistory() ?? mockHistory
}

export function getManualFields(): ManualFields {
  try {
    const raw = localStorage.getItem(MANUAL_KEY)
    return raw ? { ...DEFAULT_MANUAL, ...JSON.parse(raw) } : DEFAULT_MANUAL
  } catch { return DEFAULT_MANUAL }
}

export function saveManualFields(f: ManualFields) {
  localStorage.setItem(MANUAL_KEY, JSON.stringify(f))
}

// ─── 실데이터 기반 수익률곡선 생성 ─────────────────────────────────────────
import type { YieldCurvePoint } from '../types'

export function buildYieldCurveFromData(snap: MarketSnapshot, hist: MarketHistory): YieldCurvePoint[] {
  const h3  = hist.ktb3y  ?? []
  const h10 = hist.ktb10y ?? []

  const today3  = snap.rates.ktb3y.value
  const today10 = snap.rates.ktb10y.value

  // 주 전(≈ 5영업일), 월 전(≈ 20영업일) 기준값
  const week3   = h3.length  >= 5 ? (h3[h3.length  - 5]?.value ?? today3)  : today3
  const month3  = h3.length  >  0 ? (h3[0]?.value  ?? today3)  : today3
  const week10  = h10.length >= 5 ? (h10[h10.length - 5]?.value ?? today10) : today10
  const month10 = h10.length >  0 ? (h10[0]?.value ?? today10) : today10

  function shifted(today: number, tenor: number) {
    const t = Math.max(0, Math.min(1, (tenor - 3) / (10 - 3)))
    const wShift = (week3  - today3) + t * ((week10  - today10) - (week3  - today3))
    const mShift = (month3 - today3) + t * ((month10 - today10) - (month3 - today3))
    const r = (v: number) => Math.round(v * 1000) / 1000
    return { weekAgo: r(today + wShift), monthAgo: r(today + mShift) }
  }

  return [
    { tenor: '1Y',  value: snap.rates.ktb1y.value,  t: 1  },
    { tenor: '2Y',  value: snap.rates.ktb2y.value,  t: 2  },
    { tenor: '3Y',  value: today3,                  t: 3  },
    { tenor: '5Y',  value: snap.rates.ktb5y.value,  t: 5  },
    { tenor: '10Y', value: today10,                 t: 10 },
    { tenor: '20Y', value: snap.rates.ktb20y.value, t: 20 },
    { tenor: '30Y', value: snap.rates.ktb30y.value, t: 30 },
  ].map(({ tenor, value, t }) => ({ tenor, today: value, ...shifted(value, t) }))
}
