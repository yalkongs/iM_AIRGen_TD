import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, AlertTriangle, TrendingUp, Building2, Sparkles, Loader2, AlertCircle, Check } from 'lucide-react'
import { A4Page, A4ScaleWrapper } from '../components/A4Page'
import ReportActionsPanel from '../components/ReportActionsPanel'
import { useReportActions } from '../hooks/useReportActions'
import { fetchAdHocNarrative } from '../utils/narrativeApi'
import { getActiveSnapshot } from '../utils/marketStore'
import { snapshot } from '../utils/mockData'

const TEMPLATES = [
  { id: 'fomc',  icon: Building2,    label: 'FOMC 속보',     color: 'text-red-600',   desc: 'FOMC 결과 즉시 분석' },
  { id: 'boc',   icon: Building2,    label: '금통위 프리뷰', color: 'text-blue-600',  desc: '금통위 전망 & 시나리오' },
  { id: 'shock', icon: AlertTriangle, label: '시장 급변동',   color: 'text-amber-600', desc: '급등락 긴급 코멘터리' },
  { id: 'rate',  icon: TrendingUp,   label: '금리 이상 급등', color: 'text-red-600',   desc: '금리 급등 원인 분석' },
]

const s = snapshot

export default function AdHoc() {
  const [selected, setSelected]   = useState('shock')
  const [title, setTitle]         = useState('[긴급] 국내 CPI 예상 상회 — 금리인하 기대 약화 분석')
  const [content, setContent]     = useState(
`금일(3/6) 발표된 국내 소비자물가지수(CPI) 2월분이 전년비 2.4%를 기록, 시장 컨센서스(2.3%)를 0.1%p 상회하였습니다.

【시장 영향 분석】
1. 국내 채권시장: 금리인하 기대 약화 → 단기 약세 예상
   - 국고 3Y 즉시 반응: ${s.rates.ktb3y.value}%(+2bp)
   - 금통위(3/26) 동결 확률 시장 반영: ~95%

2. 외환시장: USD/KRW 소폭 하락 (원화 강세 압력)
   - 현재 환율: ${s.fx.usdKrw.value.toFixed(0)}원

3. 크레딧: 단기 영향 제한적, 스프레드 보합 예상

【당행 포지션 시사점】
- 단기 듀레이션 유지 권고 (3Y 이하)
- 추가 매수 대기, 3.28% 이상에서 분할 매수 검토
- 연내 금리인하 기대 후퇴 시나리오 리스크 관리 필요

【다음 모니터링 포인트】
- 22:30 미국 NFP (컨센서스 19.0만명)
- 3/11 미국 CPI (연준 정책 방향성 결정적)
- 3/26 금통위 (현재 동결 확률 높음)`
  )
  const [classification, setClassification] = useState('내부용')
  const [author, setAuthor]                 = useState('김진태')
  const [geoContext, setGeoContext]         = useState('')

  const navigate = useNavigate()
  const todayIso  = new Date().toISOString().slice(0, 10)
  const todayDisp = new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\. /g, '.').replace(/\.$/,'')

  const actions = useReportActions({
    type:           'adhoc',
    title,
    date:           todayIso,
    author,
    classification,
  })

  const handleGenerate = async () => {
    actions.setGenerating(true)
    actions.setGenError('')
    try {
      const text = await fetchAdHocNarrative(getActiveSnapshot(), selected, title, geoContext)
      setContent(text)
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
      {/* 설정 패널 */}
      <div className="lg:w-72 xl:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto no-print">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-700">수시 브리핑 설정</span>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">브리핑 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${selected === t.id ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <t.icon className={`w-4 h-4 ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">본문 편집</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={10}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-navy-600 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">등급</label>
              <select value={classification} onChange={e => setClassification(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                <option>내부용</option><option>대외비</option><option>비밀</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">작성자</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            </div>
          </div>

          {/* AI 생성 */}
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">AI 초안 생성</span>
              {actions.isReady && (
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Check className="w-3 h-3" /> 생성됨
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">주요 이슈 & 지정학적 이벤트 <span className="text-slate-400">(선택)</span></label>
              <textarea value={geoContext} onChange={e => setGeoContext(e.target.value)} rows={2}
                placeholder="예: 트럼프 관세 추가 발표, 한-미 통화스왑, 중동 지정학..."
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
                : <><Sparkles className="w-4 h-4" /> {actions.isReady ? '재생성' : 'AI 초안 생성'}</>
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
              defaultEmailSubject={title}
            />
          </div>
        </div>
      </div>

      {/* A4 미리보기 */}
      <div className="flex-1 bg-slate-200 flex flex-col relative">
        {actions.generating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 z-10 animate-pulse" />
        )}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="text-sm text-slate-500 mb-4 no-print">A4 미리보기 — 수시 브리핑</div>
          <A4ScaleWrapper>
            <A4Page ref={actions.printRef}>
              {/* 헤더 */}
              <div style={{ background: '#7c1d1d', margin: '-60px -72px 0', padding: '28px 72px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: '#fbbf24', color: '#7c2d12', fontSize: '7pt', fontWeight: 700, padding: '2px 8px', borderRadius: 2, letterSpacing: 1 }}>긴급</span>
                  <span style={{ fontSize: '7pt', color: '#fca5a5', letterSpacing: 2 }}>iMBank Trading Desk — 수시 브리핑</span>
                </div>
                <div style={{ fontSize: '14pt', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>{title}</div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#fca5a5' }}>
                  <span>{todayDisp} KST</span>
                  <span style={{ background: '#dc2626', color: 'white', padding: '1px 6px', borderRadius: 2, fontWeight: 700 }}>{classification}</span>
                </div>
              </div>
              {/* 본문 */}
              <div style={{ fontSize: '10pt', lineHeight: 1.9, whiteSpace: 'pre-line', color: '#1e293b', marginBottom: 60 }}>
                {content}
              </div>
              {/* 푸터 */}
              <div style={{ position: 'absolute', bottom: 40, left: 72, right: 72, borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#94a3b8' }}>
                <div>데이터 출처: ECOS · FRED · Yahoo Finance | 작성 시각: {todayDisp}</div>
                <div>작성: {author} | 배포: 본부장, 부행장, 자금시장부</div>
              </div>
            </A4Page>
          </A4ScaleWrapper>
        </div>
      </div>
    </div>
  )
}
