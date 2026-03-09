import { Sparkles, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  onGenerate: () => void
  generating: boolean
  genError: string
  label?: string
  // 지정학 이슈 (선택 — 주간/월간/수시에서 사용)
  geoContext?: string
  setGeoContext?: (v: string) => void
  geoPlaceholder?: string
}

export default function GenerateOverlay({
  onGenerate, generating, genError,
  label = 'Report Generation',
  geoContext, setGeoContext, geoPlaceholder,
}: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-600/25 backdrop-blur-[3px]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">
        {/* 아이콘 */}
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
          {generating
            ? <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            : <Sparkles className="w-8 h-8 text-amber-500" />
          }
        </div>

        {/* 타이틀 */}
        <div>
          <h3 className="text-lg font-bold text-slate-800">{label}</h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {generating
              ? 'AI가 마켓 총평을 작성 중입니다.\n잠시 기다려 주세요...'
              : 'AI 마켓 총평을 생성하면\nPDF 저장·이메일 발송이 활성화됩니다.'}
          </p>
        </div>

        {/* 지정학 이슈 입력 (선택) */}
        {setGeoContext && !generating && (
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              주요 이슈 & 지정학적 이벤트 <span className="font-normal text-slate-400">(선택)</span>
            </label>
            <textarea
              value={geoContext ?? ''}
              onChange={e => setGeoContext(e.target.value)}
              rows={2}
              placeholder={geoPlaceholder ?? '예: 트럼프 관세 발표, 중동 지정학 긴장...'}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 resize-none"
            />
          </div>
        )}

        {/* 생성 버튼 */}
        {!generating && (
          <button
            onClick={onGenerate}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {label}
          </button>
        )}

        {/* 에러 */}
        {genError && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{genError}</span>
          </div>
        )}
      </div>
    </div>
  )
}
