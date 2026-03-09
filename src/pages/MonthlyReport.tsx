import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings2, Sparkles, Loader2, AlertCircle, Check } from 'lucide-react'
import { A4Page, A4ScaleWrapper } from '../components/A4Page'
import MonthlyContent from '../components/reports/MonthlyContent'
import ReportActionsPanel from '../components/ReportActionsPanel'
import { useReportActions } from '../hooks/useReportActions'
import { fetchMonthlyNarrative } from '../utils/narrativeApi'
import { getActiveSnapshot } from '../utils/marketStore'
import type { ReportSection, ReportConfig } from '../types'

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: 'summary',     label: '월간 총평 & 전망',   enabled: true },
  { id: 'rateChart',   label: '금리 동향 차트',     enabled: true },
  { id: 'yieldCurve',  label: '수익률곡선',         enabled: true },
  { id: 'fxChart',     label: '외환 동향 차트',     enabled: true },
  { id: 'spreadChart', label: '크레딧 스프레드',    enabled: true },
  { id: 'overseas',    label: '중앙은행 정책 동향', enabled: true },
]

export default function MonthlyReport() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<ReportConfig>({
    date: new Date().toISOString().slice(0, 10), type: 'monthly',
    sections: DEFAULT_SECTIONS, customNote: '', author: '김진태', classification: '내부용',
  })
  const [targetMonth, setTargetMonth] = useState('2026-02')
  const [geoContext, setGeoContext]   = useState('')

  const actions = useReportActions({
    type:           'monthly',
    title:          `월간 마켓리포트 ${targetMonth}`,
    date:           config.date,
    author:         config.author,
    classification: config.classification,
  })

  const toggleSection = (id: string) =>
    setConfig(c => ({ ...c, sections: c.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s) }))

  const handleGenerate = async () => {
    actions.setGenerating(true)
    actions.setGenError('')
    try {
      const text = await fetchMonthlyNarrative(getActiveSnapshot(), targetMonth, geoContext)
      actions.setNarrative(text)
    } catch (e) {
      if (e instanceof Error && e.message === '__NO_API_KEY__') {
        actions.setGenError('Claude API 키가 필요합니다. 설정 페이지에서 입력해주세요.')
        actions.setGenerating(false)
        setTimeout(() => navigate('/settings'), 1500)
        return
      }
      actions.setGenError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      actions.setGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0">
      <div className="lg:w-72 xl:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto no-print">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">월간 리포트 설정</span>
        </div>
        <div className="flex-1 p-4 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">기준월</label>
            <input type="month" value={targetMonth}
              onChange={e => setTargetMonth(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">문서 등급</label>
            <select value={config.classification}
              onChange={e => setConfig(c => ({ ...c, classification: e.target.value as ReportConfig['classification'] }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600">
              <option>내부용</option><option>대외비</option><option>비밀</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">작성자</label>
            <input type="text" value={config.author}
              onChange={e => setConfig(c => ({ ...c, author: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">포함 섹션</label>
            <div className="space-y-2">
              {config.sections.map(sec => (
                <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={sec.enabled} onChange={() => toggleSection(sec.id)} className="w-4 h-4 rounded accent-navy-900" />
                  <span className={`text-sm ${sec.enabled ? 'text-slate-700' : 'text-slate-400'}`}>{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI 생성 */}
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">AI 마켓 총평</span>
              {actions.isReady && (
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Check className="w-3 h-3" /> 생성됨
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">주요 이슈 & 지정학적 이벤트 <span className="text-slate-400">(선택)</span></label>
              <textarea value={geoContext} onChange={e => setGeoContext(e.target.value)} rows={2}
                placeholder="예: 트럼프 관세 정책, 러-우 협상, 중동 긴장, 한-미 정상회담..."
                className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
            {actions.genError && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{actions.genError}</span>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={actions.generating}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {actions.generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</>
                : <><Sparkles className="w-4 h-4" /> {actions.isReady ? '재생성' : 'Report Generation'}</>
              }
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 mb-3">내보내기</p>
            <ReportActionsPanel
              isReady={actions.isReady}
              handleDownload={actions.handleDownload}
              handleSave={actions.handleSave}
              handlePrint={actions.handlePrint}
              handleEmail={actions.handleEmail}
              downloading={actions.downloading}
              saving={actions.saving}
              savedAt={actions.savedAt}
              emailing={actions.emailing}
              emailOpen={actions.emailOpen}
              setEmailOpen={actions.setEmailOpen}
              actionError={actions.actionError}
              defaultEmailSubject={`월간 마켓리포트 ${targetMonth}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-200 flex flex-col relative">
        {actions.generating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 z-10 animate-pulse" />
        )}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="text-sm text-slate-500 mb-4 no-print">A4 미리보기 — 월간 마켓리포트</div>
          <A4ScaleWrapper>
            <A4Page ref={actions.printRef}>
              <MonthlyContent sections={config.sections} date={config.date} classification={config.classification} author={config.author} narrative={actions.narrative} narrativeLoading={actions.generating} />
            </A4Page>
          </A4ScaleWrapper>
        </div>
      </div>
    </div>
  )
}
