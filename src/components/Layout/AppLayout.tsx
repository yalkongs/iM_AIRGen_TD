import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { LayoutDashboard, FileText, BarChart2, BookOpen, Zap, Archive, Database, Settings } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/':        '대시보드',
  '/daily':   '일간 모닝브리프',
  '/weekly':  '주간 마켓리뷰',
  '/monthly': '월간 마켓리포트',
  '/adhoc':   '수시 브리핑',
  '/archive': '아카이브',
  '/data':    '데이터 관리',
  '/settings':'설정',
}

const MOB_NAV = [
  { to: '/',        icon: LayoutDashboard, label: '홈' },
  { to: '/daily',   icon: FileText,        label: '일간' },
  { to: '/weekly',  icon: BarChart2,       label: '주간' },
  { to: '/monthly', icon: BookOpen,        label: '월간' },
  { to: '/adhoc',   icon: Zap,             label: '수시' },
  { to: '/archive', icon: Archive,         label: '아카이브' },
  { to: '/settings',icon: Settings,        label: '설정' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'MKT·DESK'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* 메인 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-slate-100 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center z-50 no-print">
        {MOB_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-[10px] gap-0.5 transition-colors ${isActive ? 'text-navy-900 font-semibold' : 'text-slate-400'}`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
