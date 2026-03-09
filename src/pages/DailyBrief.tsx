import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Settings2, Sparkles, Loader2, AlertCircle, Check } from 'lucide-react'
import { A4Page, A4ScaleWrapper } from '../components/A4Page'
import DailyBriefContent from '../components/reports/DailyBriefContent'
import ReportActionsPanel from '../components/ReportActionsPanel'
import { useReportActions } from '../hooks/useReportActions'
import { fetchDailyNarrative } from '../utils/narrativeApi'
import { getActiveSnapshot } from '../utils/marketStore'
import { todayEvents } from '../utils/mockData'
import type { ReportSection, ReportConfig } from '../types'

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: 'summary',    label: '마켓 총평 (AI 서술)', enabled: true  },
  { id: 'rateTable',  label: '국내 금리 표',        enabled: true  },
  { id: 'fxTable',    label: '외환/해외 금리 표',   enabled: true  },
  { id: 'yieldCurve', label: '수익률곡선 차트',     enabled: true  },
  { id: 'rateChart',  label: '금리 추이 차트',      enabled: true  },
  { id: 'fxChart',    label: '환율/미국채 차트',    enabled: true  },
  { id: 'overseas',   label: '해외 주요 동향',      enabled: true  },
  { id: 'calendar',   label: '금일 주요 일정',      enabled: true  },
  { id: 'moneyMarket',label: '단기자금시장 현황',   enabled: false },
]

export default function DailyBrief() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [config, setConfig] = useState<ReportConfig>({
    date: new Date().toISOString().slice(0, 10),
    type: 'daily',
    sections: DEFAULT_SECTIONS,
    customNote: '',
    author: '김진태',
    classification: '내부용',
  })

  const navigate = useNavigate()

  const actions = useReportActions({
    type:           'daily',
    title:          `자금시장 모닝브리프 ${config.date}`,
    date:           config.date,
    author:         config.author,
    classification: config.classification,
  })

  const toggleSection = (id: string) =>
    setConfig(c => ({
      ...c,
      sections: c.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }))

  const handleGenerate = async () => {
    actions.setGenerating(true)
    actions.setGenError('')
    try {
      const text = await fetchDailyNarrative(getActiveSnapshot(), todayEvents)
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
      {/* ── 좌측 설정 패널 ── */}
      <div className="lg:w-72 xl:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto no-print">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">리포트 설정</span>
          </div>
          <button onClick={() => setPanelOpen(o => !o)} className="lg:hidden p-1 rounded hover:bg-slate-100">
            {panelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {panelOpen && (
          <div className="flex-1 p-4 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">기준일</label>
              <input type="date" value={config.date}
                onChange={e => setConfig(c => ({ ...c, date: e.target.value }))}
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">추가 코멘트 (선택)</label>
              <textarea value={config.customNote}
                onChange={e => setConfig(c => ({ ...c, customNote: e.target.value }))}
                rows={3} placeholder="임원 지시사항, 특이사항 등..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 resize-none" />
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
                defaultEmailSubject={`자금시장 모닝브리프 ${config.date}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 우측: A4 미리보기 ── */}
      <div className="flex-1 bg-slate-200 flex flex-col relative">
        {actions.generating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 z-10 animate-pulse" />
        )}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="text-sm text-slate-500 mb-4 no-print">A4 미리보기</div>
          <A4ScaleWrapper>
            <A4Page ref={actions.printRef}>
              <DailyBriefContent
                sections={config.sections}
                date={config.date}
                classification={config.classification}
                author={config.author}
                customNote={config.customNote}
                narrative={actions.narrative}
                narrativeLoading={actions.generating}
              />
            </A4Page>
          </A4ScaleWrapper>
        </div>
      </div>
    </div>
  )
}
