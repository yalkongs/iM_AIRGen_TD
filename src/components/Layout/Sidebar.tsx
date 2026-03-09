import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BarChart2, BookOpen,
  Zap, Archive, Database, Settings, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: '대시보드' },
  { to: '/daily',   icon: FileText,        label: '일간 모닝브리프' },
  { to: '/weekly',  icon: BarChart2,       label: '주간 마켓리뷰' },
  { to: '/monthly', icon: BookOpen,        label: '월간 마켓리포트' },
  { to: '/adhoc',   icon: Zap,             label: '수시 브리핑' },
]
const NAV2 = [
  { to: '/archive', icon: Archive,         label: '아카이브' },
  { to: '/data',    icon: Database,        label: '데이터 관리' },
  { to: '/settings',icon: Settings,        label: '설정' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col bg-navy-900 text-slate-300 transition-all duration-300 shrink-0 relative',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* 로고 */}
      <div className={clsx('flex items-center gap-2 px-4 py-4 border-b border-navy-700', collapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 bg-gold-500 rounded-md flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">iMBank</div>
            <div className="text-slate-400 text-[10px] leading-tight">Trading Desk</div>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-0'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        <div className="my-2 border-t border-navy-700" />

        {NAV2.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-0'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 접기 버튼 */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-navy-900 border border-navy-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
