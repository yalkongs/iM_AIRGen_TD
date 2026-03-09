import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, BarChart2, BookOpen, Zap,
  TrendingUp, TrendingDown, Minus,
  AlertCircle, Calendar, RefreshCw,
} from 'lucide-react'
import {
  buildSnapshot, getActiveSnapshot, getActiveHistory,
  getManualFields, saveSnapshot, saveHistory,
  type FetchedMarketData,
} from '../utils/marketStore'
import { todayEvents } from '../utils/mockData'
import type { MarketSnapshot, MarketHistory } from '../types'
import RateHistoryChart from '../components/charts/RateHistoryChart'
import FXChart from '../components/charts/FXChart'

// ─── 유틸 컴포넌트 ────────────────────────────────────────────────────────────

function ChangeTag({ v, isBp }: { v: number; isBp?: boolean }) {
  const fmt = (n: number, d = 2) => n.toFixed(d)
  const label = isBp
    ? (v > 0 ? `+${v}bp` : v < 0 ? `${v}bp` : '‑')
    : (v > 0 ? `+${fmt(v)}` : v < 0 ? fmt(v) : '‑')
  const cls = v > 0
    ? 'text-red-500 bg-red-50'
    : v < 0 ? 'text-emerald-600 bg-emerald-50'
    : 'text-slate-400 bg-slate-50'
  const Icon = v > 0 ? TrendingUp : v < 0 ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  )
}

function MetricCard({ label, value, unit, change, isBp, sub }: {
  label: string; value: string; unit?: string; change: number; isBp?: boolean; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-800">
          {value}<span className="text-sm font-normal text-slate-400">{unit}</span>
        </span>
        <ChangeTag v={change} isBp={isBp} />
      </div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-7 bg-slate-100 rounded w-3/4" />
    </div>
  )
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className={ok ? 'text-slate-300' : 'text-red-300'}>{label}</span>
    </span>
  )
}

const IMPORTANCE_COLOR: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-slate-300',
}

// ─── 대시보드 ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const nav = useNavigate()

  const [snap, setSnap]           = useState<MarketSnapshot>(getActiveSnapshot())
  const [hist, setHist]           = useState<MarketHistory>(getActiveHistory())
  const [loading, setLoading]     = useState(true)
  const [errors, setErrors]       = useState<string[]>([])
  const [fetchStatus, setFetchStatus] = useState<{ ecos: string; fred: string; yahoo: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')

  const doFetch = useCallback(async () => {
    setLoading(true)
    setErrors([])
    try {
      const res  = await fetch('/api/market/fetch')
      const data = await res.json() as FetchedMarketData

      const built = buildSnapshot(data, getManualFields())
      saveSnapshot(built)

      if (data.historyData) {
        saveHistory(data.historyData)
        setHist(prev => ({ ...prev, ...data.historyData }))
      }

      setSnap(built)
      setFetchStatus(data.status)
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))

      if (data.errors?.length) setErrors(data.errors)
    } catch (e) {
      setErrors(['서버 연결 실패 — 저장된 스냅샷으로 표시 중'])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { doFetch() }, [doFetch])

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

  const s   = snap
  const fmt = (v: number, d = 2) => v.toFixed(d)

  const spread10y3y   = Math.round((s.rates.ktb10y.value - s.rates.ktb3y.value) * 100)
  const spreadBank3y  = Math.round((s.rates.bankBond3y.value - s.rates.ktb3y.value) * 100)
  const spreadCorp3y  = Math.round((s.rates.corpAAMinus3y.value - s.rates.ktb3y.value) * 100)

  return (
    <div className="p-4 md:p-6 space-y-6 fade-in">

      {/* 상단 배너 */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-700 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400">
                {today} · {loading ? '데이터 수집 중...' : lastUpdated ? `${lastUpdated} 갱신` : 'ECOS · FRED · Yahoo Finance'}
              </span>
              {loading && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin shrink-0" />}
            </div>
            <div className="text-xl font-bold">자금시장 마켓 오버뷰</div>
            {fetchStatus && (
              <div className="flex items-center gap-3 mt-2">
                <StatusDot ok={fetchStatus.ecos === 'ok'} label="ECOS" />
                <StatusDot ok={fetchStatus.fred === 'ok'} label="FRED" />
                <StatusDot ok={fetchStatus.yahoo === 'ok'} label="Yahoo" />
              </div>
            )}
            {errors.length > 0 && (
              <div className="mt-2 text-xs text-amber-300 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{errors.join(' | ')}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <button
              onClick={doFetch}
              disabled={loading}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 갱신
            </button>
            <button
              onClick={() => nav('/daily')}
              className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> 모닝브리프 생성
            </button>
          </div>
        </div>
      </div>

      {/* 국내 금리 */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">국내 금리</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : <>
            <MetricCard label="기준금리"    value={fmt(s.rates.baseRate)} unit="%" change={0} isBp sub="한국은행" />
            <MetricCard label="국고채 3Y"  value={fmt(s.rates.ktb3y.value)} unit="%" change={s.rates.ktb3y.change} isBp sub={`10Y 스프레드 ${spread10y3y > 0 ? '+' : ''}${spread10y3y}bp`} />
            <MetricCard label="국고채 5Y"  value={fmt(s.rates.ktb5y.value)} unit="%" change={s.rates.ktb5y.change} isBp />
            <MetricCard label="국고채 10Y" value={fmt(s.rates.ktb10y.value)} unit="%" change={s.rates.ktb10y.change} isBp />
            <MetricCard label="콜금리"     value={fmt(s.rates.call.value)} unit="%" change={s.rates.call.change} isBp sub="익오버" />
            <MetricCard label="CD 91일"    value={fmt(s.rates.cd91.value)} unit="%" change={s.rates.cd91.change} isBp />
            <MetricCard label="은행채 AAA 3Y" value={fmt(s.rates.bankBond3y.value)} unit="%" change={s.rates.bankBond3y.change} isBp sub={`KTB 스프레드 +${spreadBank3y}bp`} />
            <MetricCard label="회사채 AA- 3Y" value={fmt(s.rates.corpAAMinus3y.value)} unit="%" change={s.rates.corpAAMinus3y.change} isBp sub={`KTB 스프레드 +${spreadCorp3y}bp`} />
          </>}
        </div>
      </div>

      {/* 외환 */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">외환</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : <>
            <MetricCard label="USD/KRW"    value={fmt(s.fx.usdKrw.value, 1)} unit="원" change={s.fx.usdKrw.change} sub={`NDF1M ${fmt(s.fx.ndf1m.value, 1)}원`} />
            <MetricCard label="EUR/KRW"    value={fmt(s.fx.eurKrw.value, 1)} unit="원" change={s.fx.eurKrw.change} />
            <MetricCard label="JPY/KRW(100)" value={fmt(s.fx.jpyKrw.value * 100, 2)} unit="원" change={parseFloat((s.fx.jpyKrw.change * 100).toFixed(2))} />
            <MetricCard label="DXY"        value={fmt(s.fx.dxy.value, 2)} unit="" change={s.fx.dxy.change} />
          </>}
        </div>
      </div>

      {/* 해외 & 리스크 */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">해외 & 리스크</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {loading ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />) : <>
            <MetricCard label="미 국채 2Y"  value={fmt(s.overseas.ust2y.value)} unit="%" change={s.overseas.ust2y.change} isBp />
            <MetricCard label="미 국채 10Y" value={fmt(s.overseas.ust10y.value)} unit="%" change={s.overseas.ust10y.change} isBp />
            <MetricCard label="KOSPI"       value={s.overseas.kospi.value.toLocaleString()} unit="" change={s.overseas.kospi.change} sub="전일대비" />
            <MetricCard label="VIX"         value={fmt(s.overseas.vix.value, 1)} unit="" change={s.overseas.vix.change} sub="공포지수" />
            <MetricCard label="WTI"         value={fmt(s.overseas.wti.value, 1)} unit="$" change={s.overseas.wti.change} />
          </>}
        </div>
      </div>

      {/* 추가 지표 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard label="S&P 500"      value={s.overseas.sp500.value.toLocaleString()} unit="" change={s.overseas.sp500.change} />
          <MetricCard label="금 (Gold)"    value={s.overseas.gold.value.toLocaleString()} unit="$" change={s.overseas.gold.change} />
          <MetricCard label="IRS 3Y"       value={fmt(s.rates.irs3y.value)} unit="%" change={s.rates.irs3y.change} isBp />
          <MetricCard label="한국 CDS 5Y"  value={fmt(s.overseas.koreaCds5y.value, 1)} unit="bp" change={s.overseas.koreaCds5y.change} />
        </>}
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">국고채 금리 추이 (20영업일)</h3>
            <span className="text-xs text-slate-400">— 3Y &nbsp; — 10Y</span>
          </div>
          {loading
            ? <div className="h-40 bg-slate-50 rounded animate-pulse" />
            : <RateHistoryChart ktb3y={hist.ktb3y} ktb10y={hist.ktb10y} />
          }
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">USD/KRW 추이 (20영업일)</h3>
            {snap.date && <span className="text-xs text-slate-400">기준: {snap.date}</span>}
          </div>
          {loading
            ? <div className="h-40 bg-slate-50 rounded animate-pulse" />
            : <FXChart data={hist.usdKrw} color="#1e3a6e" label="USD/KRW" />
          }
        </div>
      </div>

      {/* 오늘 일정 + 빠른 생성 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">주요 경제 일정</h3>
            </div>
            <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-medium">수동 입력 / 데이터 관리</span>
          </div>
          <div className="space-y-1.5">
            {todayEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 text-xs w-10 shrink-0">{ev.time}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPORTANCE_COLOR[ev.importance]}`} />
                <span className="text-xs font-medium text-slate-500 w-8 shrink-0">{ev.country}</span>
                <span className="flex-1 text-slate-700 text-xs truncate">{ev.event}</span>
                <span className="text-xs text-slate-400 shrink-0">예상 {ev.forecast}</span>
                {ev.actual && (
                  <span className={`text-xs font-bold shrink-0 ${ev.actual > ev.forecast ? 'text-red-500' : 'text-emerald-600'}`}>
                    실제 {ev.actual}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">리포트 빠른 생성</h3>
          </div>
          <div className="space-y-2">
            {[
              { icon: FileText,  label: '일간 모닝브리프',   to: '/daily',   color: 'bg-navy-900 text-white' },
              { icon: BarChart2, label: '주간 마켓리뷰',     to: '/weekly',  color: 'bg-navy-800 text-white' },
              { icon: BookOpen,  label: '월간 마켓리포트',   to: '/monthly', color: 'bg-navy-700 text-white' },
              { icon: Zap,       label: '수시 브리핑',       to: '/adhoc',   color: 'bg-amber-500 text-white' },
            ].map(({ icon: Icon, label, to, color }) => (
              <button
                key={to}
                onClick={() => nav(to)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${color}`}
              >
                <Icon className="w-4 h-4" />{label} 생성
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
