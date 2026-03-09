import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Save, Database, Wifi, WifiOff } from 'lucide-react'
import {
  type ManualFields,
  type FetchedMarketData,
  DEFAULT_MANUAL,
  buildSnapshot,
  saveSnapshot,
  saveHistory,
  saveManualFields,
  getManualFields,
} from '../utils/marketStore'

// ─── 수동 입력 필드 정의 ────────────────────────────────────────────────────
const MANUAL_GROUPS: {
  title: string
  fields: { key: keyof ManualFields; label: string; unit: string; changeUnit: string }[]
}[] = [
  {
    title: '단기자금 / 스왑',
    fields: [
      { key: 'rp7',      label: 'RP 7일',        unit: '%',  changeUnit: 'bp' },
      { key: 'ndf1m',    label: 'NDF 1M',         unit: '원', changeUnit: '원' },
      { key: 'swapPt1m', label: '스왑포인트 1M',  unit: 'pt', changeUnit: 'pt' },
      { key: 'swapPt3m', label: '스왑포인트 3M',  unit: 'pt', changeUnit: 'pt' },
    ],
  },
  {
    title: 'IRS',
    fields: [
      { key: 'irs1y', label: 'IRS 1Y', unit: '%', changeUnit: 'bp' },
      { key: 'irs3y', label: 'IRS 3Y', unit: '%', changeUnit: 'bp' },
      { key: 'irs5y', label: 'IRS 5Y', unit: '%', changeUnit: 'bp' },
    ],
  },
  {
    title: '크레딧',
    fields: [
      { key: 'bankBond3y',     label: '은행채 AAA 3Y', unit: '%', changeUnit: 'bp' },
      { key: 'corpAAMinus3y',  label: '회사채 AA- 3Y', unit: '%', changeUnit: 'bp' },
      { key: 'corpBBBMinus3y', label: '회사채 BBB- 3Y',unit: '%', changeUnit: 'bp' },
    ],
  },
  {
    title: '해외 기타',
    fields: [
      { key: 'euribor3m',  label: 'EURIBOR 3M',    unit: '%',  changeUnit: 'bp' },
      { key: 'koreaCds5y', label: '한국 CDS 5Y',   unit: 'bp', changeUnit: '' },
    ],
  },
]

// ─── 소스별 조회 항목 목록 ──────────────────────────────────────────────────
const FETCHED_ROWS: {
  source: 'ecos' | 'fred' | 'yahoo'
  category: string
  label: string
  get: (d: FetchedMarketData) => { value: number; change: number } | null | undefined
  fmt: (v: number) => string
  changeUnit: string
}[] = [
  { source: 'ecos',  category: '국내 금리', label: '기준금리',    get: d => d.ecosData.baseRate != null ? { value: d.ecosData.baseRate, change: 0 } : null, fmt: v => v.toFixed(2)+'%', changeUnit: '' },
  { source: 'ecos',  category: '국내 금리', label: '콜금리',      get: d => d.ecosData.call,   fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: 'CD 91일',     get: d => d.ecosData.cd91,   fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: 'CP 91일(A1)', get: d => d.ecosData.cp91,   fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 1Y',   get: d => d.ecosData.ktb1y,  fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 3Y',   get: d => d.ecosData.ktb3y,  fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 5Y',   get: d => d.ecosData.ktb5y,  fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 10Y',  get: d => d.ecosData.ktb10y, fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 20Y',  get: d => d.ecosData.ktb20y, fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '국내 금리', label: '국고채 30Y',  get: d => d.ecosData.ktb30y, fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'ecos',  category: '외환',      label: 'USD/KRW',     get: d => d.ecosData.usdKrw, fmt: v => v.toFixed(1)+'원', changeUnit: '원' },
  { source: 'fred',  category: '해외 금리', label: '미 국채 2Y',  get: d => d.fredData.ust2y,  fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'fred',  category: '해외 금리', label: '미 국채 10Y', get: d => d.fredData.ust10y, fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'fred',  category: '해외 금리', label: '미 국채 30Y', get: d => d.fredData.ust30y, fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'fred',  category: '해외 금리', label: 'SOFR',        get: d => d.fredData.sofr,   fmt: v => v.toFixed(2)+'%', changeUnit: 'bp' },
  { source: 'yahoo', category: '외환',      label: 'EUR/KRW',     get: d => d.yahooData.eurKrw, fmt: v => v.toFixed(1)+'원', changeUnit: '원' },
  { source: 'yahoo', category: '외환',      label: 'JPY/KRW(100)',get: d => d.yahooData.jpyKrw ? { value: d.yahooData.jpyKrw.value * 100, change: d.yahooData.jpyKrw.change * 100 } : null, fmt: v => v.toFixed(2)+'원', changeUnit: '원' },
  { source: 'yahoo', category: '외환',      label: 'CNH/KRW',     get: d => d.yahooData.cnhKrw, fmt: v => v.toFixed(2)+'원', changeUnit: '원' },
  { source: 'yahoo', category: '외환',      label: 'DXY',         get: d => d.yahooData.dxy,    fmt: v => v.toFixed(2), changeUnit: '' },
  { source: 'yahoo', category: '주가/원자재',label: 'S&P500',      get: d => d.yahooData.sp500,  fmt: v => v.toLocaleString(), changeUnit: '%' },
  { source: 'yahoo', category: '주가/원자재',label: 'KOSPI',       get: d => d.yahooData.kospi,  fmt: v => v.toLocaleString(), changeUnit: '%' },
  { source: 'yahoo', category: '주가/원자재',label: 'NASDAQ',      get: d => d.yahooData.nasdaq, fmt: v => v.toLocaleString(), changeUnit: '%' },
  { source: 'yahoo', category: '주가/원자재',label: 'Nikkei',      get: d => d.yahooData.nikkei, fmt: v => v.toLocaleString(), changeUnit: '%' },
  { source: 'yahoo', category: '주가/원자재',label: 'VIX',         get: d => d.yahooData.vix,    fmt: v => v.toFixed(2), changeUnit: '' },
  { source: 'yahoo', category: '주가/원자재',label: 'WTI',         get: d => d.yahooData.wti,    fmt: v => '$'+v.toFixed(1), changeUnit: '$' },
  { source: 'yahoo', category: '주가/원자재',label: '금(Gold)',     get: d => d.yahooData.gold,   fmt: v => '$'+v.toLocaleString(), changeUnit: '$' },
]

const SOURCE_LABEL: Record<string, string> = { ecos: 'ECOS', fred: 'FRED', yahoo: 'Yahoo' }

function chgText(v: number, unit: string) {
  if (unit === '') return ''
  const sign = v > 0 ? '+' : ''
  const num  = unit === 'bp' ? v.toFixed(0) : v.toFixed(2)
  return `${sign}${num}${unit}`
}

export default function DataManager() {
  const [fetching, setFetching]     = useState(false)
  const [fetchResult, setFetchResult] = useState<FetchedMarketData | null>(null)
  const [manual, setManual]         = useState<ManualFields>(() => getManualFields())
  const [saving, setSaving]         = useState(false)
  const [savedAt, setSavedAt]       = useState<string | null>(null)

  useEffect(() => {
    setManual(getManualFields())
  }, [])

  const handleFetch = async () => {
    setFetching(true)
    try {
      const res  = await fetch('/api/market/fetch')
      const data: FetchedMarketData = await res.json()
      setFetchResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setFetching(false)
    }
  }

  const handleSave = () => {
    setSaving(true)
    saveManualFields(manual)
    const snapshot = buildSnapshot(
      fetchResult ?? { ecosData: {}, fredData: {}, yahooData: {}, status: { ecos: 'ok', fred: 'ok', yahoo: 'ok' }, errors: [] },
      manual
    )
    saveSnapshot(snapshot)
    if (fetchResult?.historyData) {
      saveHistory(fetchResult.historyData as Parameters<typeof saveHistory>[0])
    }
    setTimeout(() => {
      setSaving(false)
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
    }, 300)
  }

  const setField = (key: keyof ManualFields, sub: 'value' | 'change', val: string) => {
    setManual(prev => ({ ...prev, [key]: { ...prev[key], [sub]: parseFloat(val) || 0 } }))
  }

  const inputCls = 'w-full border border-slate-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-navy-600'

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">데이터 관리</h2>
          <p className="text-sm text-slate-500 mt-0.5">시장 데이터 수집 및 수동 입력 관리</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-xs text-emerald-600 font-medium">{savedAt} 저장됨</span>
          )}
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? '수집 중...' : '데이터 갱신'}
          </button>
        </div>
      </div>

      {/* 소스 상태 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { id: 'ecos',  name: '한국은행 ECOS', desc: '기준금리 · 국내 금리 · USD/KRW' },
          { id: 'fred',  name: 'FRED (미 연준)', desc: '미 국채 · SOFR' },
          { id: 'yahoo', name: 'Yahoo Finance',  desc: '환율 · 주가 · 원자재 · VIX' },
        ] as { id: 'ecos' | 'fred' | 'yahoo'; name: string; desc: string }[]).map(src => {
          const st = fetchResult?.status[src.id]
          return (
            <div key={src.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {!fetchResult ? (
                  <Wifi className="w-4 h-4 text-slate-300" />
                ) : st === 'ok' ? (
                  <Wifi className="w-4 h-4 text-emerald-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="font-semibold text-sm text-slate-800">{src.name}</span>
                {fetchResult && (
                  <span className={`ml-auto text-xs font-medium ${st === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {st === 'ok' ? '정상' : '오류'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 ml-6">{src.desc}</p>
            </div>
          )
        })}
      </div>

      {/* 오류 메시지 */}
      {fetchResult?.errors && fetchResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
          {fetchResult.errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{e}
            </div>
          ))}
        </div>
      )}

      {/* 수집된 데이터 테이블 */}
      {fetchResult && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            수집 데이터
            {fetchResult.ecosData.date && (
              <span className="text-xs font-normal text-slate-400">({fetchResult.ecosData.date} 기준)</span>
            )}
          </h3>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2 border-b border-slate-100">
              <div className="col-span-2">소스</div>
              <div className="col-span-2">카테고리</div>
              <div className="col-span-4">항목</div>
              <div className="col-span-2 text-right">값</div>
              <div className="col-span-2 text-right">전일대비</div>
            </div>
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {FETCHED_ROWS.map((row, i) => {
                const item = row.get(fetchResult)
                return (
                  <div key={i} className="grid grid-cols-12 items-center px-4 py-2 hover:bg-slate-50 text-xs">
                    <div className="col-span-2">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-medium">
                        {SOURCE_LABEL[row.source]}
                      </span>
                    </div>
                    <div className="col-span-2 text-slate-400">{row.category}</div>
                    <div className="col-span-4 text-slate-700 font-medium">{row.label}</div>
                    <div className="col-span-2 text-right font-semibold text-slate-800">
                      {item ? row.fmt(item.value) : <span className="text-slate-300">-</span>}
                    </div>
                    <div className={`col-span-2 text-right font-medium ${
                      item && item.change > 0 ? 'text-red-500' :
                      item && item.change < 0 ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {item ? chgText(item.change, row.changeUnit) : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 수동 입력 섹션 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-1">수동 입력 항목</h3>
        <p className="text-xs text-slate-400 mb-3">인포맥스·블룸버그 등에서 확인 후 직접 입력하세요 (IRS, 크레딧, NDF, 스왑포인트 등)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MANUAL_GROUPS.map(group => (
            <div key={group.title} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-600">{group.title}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-12 text-xs text-slate-400 font-medium mb-1 px-1">
                  <div className="col-span-5">항목</div>
                  <div className="col-span-4 text-right">현재값</div>
                  <div className="col-span-3 text-right">전일대비</div>
                </div>
                {group.fields.map(f => (
                  <div key={f.key} className="grid grid-cols-12 items-center gap-1">
                    <div className="col-span-5 text-xs text-slate-600 font-medium pl-1">
                      {f.label}
                      {f.unit && <span className="text-slate-400 ml-0.5">({f.unit})</span>}
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="0.01"
                        value={manual[f.key].value}
                        onChange={e => setField(f.key, 'value', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step={f.changeUnit === 'bp' ? '1' : '0.1'}
                        value={manual[f.key].change}
                        onChange={e => setField(f.key, 'change', e.target.value)}
                        className={inputCls}
                        placeholder={f.changeUnit}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          저장하면 대시보드·모닝브리프에 즉시 반영됩니다
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '저장 중...' : '전체 저장'}
        </button>
      </div>

    </div>
  )
}
