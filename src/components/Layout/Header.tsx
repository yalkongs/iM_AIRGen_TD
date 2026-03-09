import { Bell, RefreshCw, TrendingUp } from 'lucide-react'
import { getActiveSnapshot } from '../../utils/marketStore'

interface Props {
  title: string
}

export default function Header({ title }: Props) {
  const s    = getActiveSnapshot()
  const usd  = s.fx.usdKrw
  const ktb3 = s.rates.ktb3y
  const kospi = s.overseas.kospi

  const now  = new Date()
  const dateStr = now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('. ', '/').replace('.', '')
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 no-print">
      {/* 모바일 로고 */}
      <div className="md:hidden flex items-center gap-2 mr-2">
        <div className="w-7 h-7 bg-gold-500 rounded flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-navy-900 text-sm">iMBank</span>
      </div>

      <h1 className="text-sm font-semibold text-slate-700 hidden md:block">{title}</h1>

      {/* 실시간 티커 */}
      <div className="flex-1 hidden sm:flex items-center gap-4 overflow-x-auto">
        <Ticker label="USD/KRW" value={usd.value.toFixed(1)}    change={usd.change}   unit="" />
        <Ticker label="국고3Y"  value={ktb3.value.toFixed(2)}   change={ktb3.change}  unit="%" isBp />
        <Ticker label="KOSPI"   value={kospi.value.toLocaleString()} change={kospi.change} unit="" isPct />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-400 hidden lg:block">
          {dateStr} {timeStr} · ECOS · FRED · Yahoo
        </span>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

function Ticker({ label, value, change, unit, isBp, isPct }: {
  label: string; value: string; change: number; unit: string; isBp?: boolean; isPct?: boolean
}) {
  const pos = change > 0
  const neg = change < 0
  const display = isBp
    ? (pos ? `▲${change}bp` : neg ? `▼${Math.abs(change)}bp` : '‑')
    : isPct
    ? (pos ? `▲${change.toFixed(1)}` : neg ? `▼${Math.abs(change).toFixed(1)}` : '‑')
    : (pos ? `▲${change.toFixed(1)}` : neg ? `▼${Math.abs(change).toFixed(1)}` : '‑')

  return (
    <div className="flex items-center gap-1.5 shrink-0 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}{unit}</span>
      <span className={pos ? 'text-red-500' : neg ? 'text-emerald-600' : 'text-slate-400'}>{display}</span>
    </div>
  )
}
