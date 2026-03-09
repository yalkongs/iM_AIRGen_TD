import { useState } from 'react'
import { Info, X } from 'lucide-react'

const NOTICE_KEY = 'data_notice_seen'

export default function DataNotice() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(NOTICE_KEY))

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(NOTICE_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* 상단 컬러 바 */}
      <div className="h-1 bg-gradient-to-r from-navy-900 to-blue-500" />

      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">데이터 출처 안내</span>
          </div>
          <button
            onClick={dismiss}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            본 시스템은 <span className="font-semibold text-slate-800">한국은행 ECOS</span>,{' '}
            <span className="font-semibold text-slate-800">미 연준 FRED</span>,{' '}
            <span className="font-semibold text-slate-800">Yahoo Finance</span> 등
            공개 무료 API를 통해 시장 데이터를 수집합니다.
          </p>
          <ul className="space-y-1 pl-3 border-l-2 border-slate-100">
            <li><span className="text-amber-600 font-medium">시차:</span> 전영업일 기준 데이터가 익일 오전 반영되는 경우가 있습니다.</li>
            <li><span className="text-amber-600 font-medium">정확도:</span> 유료 실시간 데이터와 소폭 차이가 있을 수 있습니다.</li>
            <li><span className="text-amber-600 font-medium">범위:</span> 일부 지표는 API 제공 범위의 한계로 대체값이 사용될 수 있습니다.</li>
          </ul>
          <p className="text-slate-400 text-[11px]">
            중요 의사결정 시 공식 데이터 소스를 병행 확인하시기 바랍니다.
          </p>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={dismiss}
          className="mt-4 w-full bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          확인했습니다
        </button>
      </div>
    </div>
  )
}
