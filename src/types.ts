export interface RateItem {
  value: number
  change: number // 전일 대비 bp 또는 퍼센트
}

export interface HistoryPoint {
  date: string
  value: number
}

export interface MarketSnapshot {
  date: string
  rates: {
    baseRate: number
    call: RateItem
    cd91: RateItem
    cp91: RateItem
    rp7: RateItem
    ktb1y: RateItem
    ktb2y: RateItem
    ktb3y: RateItem
    ktb5y: RateItem
    ktb10y: RateItem
    ktb20y: RateItem
    ktb30y: RateItem
    irs1y: RateItem
    irs3y: RateItem
    irs5y: RateItem
    bankBond3y: RateItem
    corpAAMinus3y: RateItem
    corpBBBMinus3y: RateItem
  }
  fx: {
    usdKrw: RateItem
    eurKrw: RateItem
    jpyKrw: RateItem
    cnhKrw: RateItem
    dxy: RateItem
    ndf1m: RateItem
    swapPt1m: RateItem
    swapPt3m: RateItem
  }
  overseas: {
    ust2y: RateItem
    ust10y: RateItem
    ust30y: RateItem
    sofr: RateItem
    euribor3m: RateItem
    sp500: RateItem
    kospi: RateItem
    nasdaq: RateItem
    nikkei: RateItem
    vix: RateItem
    wti: RateItem
    gold: RateItem
    koreaCds5y: RateItem
  }
}

export interface MarketHistory {
  ktb3y: HistoryPoint[]
  ktb10y: HistoryPoint[]
  usdKrw: HistoryPoint[]
  ust10y: HistoryPoint[]
  corpSpread: HistoryPoint[] // Corp AA- vs KTB3Y spread (bp)
}

export interface YieldCurvePoint {
  tenor: string
  today: number
  weekAgo: number
  monthAgo: number
}

export interface EconomicEvent {
  time: string
  country: 'KR' | 'US' | 'EU' | 'JP' | 'CN'
  event: string
  previous: string
  forecast: string
  actual?: string
  importance: 'high' | 'medium' | 'low'
}

export interface ReportSection {
  id: string
  label: string
  enabled: boolean
}

export interface ReportConfig {
  date: string
  type: 'daily' | 'weekly' | 'monthly' | 'adhoc'
  sections: ReportSection[]
  customNote: string
  author: string
  classification: '내부용' | '대외비' | '비밀'
}

export interface SavedReport {
  id: string
  date: string
  type: 'daily' | 'weekly' | 'monthly' | 'adhoc'
  title: string
  createdAt: string
  author: string
}
