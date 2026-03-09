import { useState, useEffect } from 'react'
import { Bell, Clock, Users, Mail, Shield, Palette, KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import { getClaudeApiKey, setClaudeApiKey } from '../utils/apiKeyStore'

function Section({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {desc && <div className="text-xs text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${value ? 'bg-navy-900' : 'bg-slate-200'}`}
      style={{ height: 22 }}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [keySaved, setKeySaved]   = useState(false)
  const [hasKey, setHasKey]       = useState(false)

  useEffect(() => {
    const saved = getClaudeApiKey()
    if (saved) {
      setApiKey(saved)
      setHasKey(true)
    }
  }, [])

  const handleSaveKey = () => {
    setClaudeApiKey(apiKey)
    setHasKey(!!apiKey.trim())
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const handleClearKey = () => {
    setClaudeApiKey('')
    setApiKey('')
    setHasKey(false)
  }

  const [auto, setAuto] = useState(true)
  const [notify, setNotify] = useState(true)
  const [emailSend, setEmailSend] = useState(false)
  const [kakao, setKakao] = useState(false)
  const [darkHeader, setDarkHeader] = useState(true)
  const [watermark, setWatermark] = useState(true)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl fade-in">
      <div>
        <h2 className="text-lg font-bold text-slate-800">설정</h2>
        <p className="text-sm text-slate-500 mt-0.5">MKT·DESK 환경 설정</p>
      </div>

      <Section icon={KeyRound} title="Claude API 설정">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            {hasKey
              ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> API 키 설정됨</span>
              : <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">API 키 미설정 — AI 리포트 생성 불가</span>
            }
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Anthropic Console(<span className="font-mono">console.anthropic.com</span>)에서 발급한 Claude API 키를 입력하세요.
            키는 이 브라우저에만 저장되며 서버로 전송되지 않습니다.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-navy-600 font-mono"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {keySaved ? '저장됨 ✓' : '저장'}
            </button>
            {hasKey && (
              <button
                onClick={handleClearKey}
                className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm rounded-lg transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section icon={Clock} title="자동화 스케줄">
        <Row label="자동 데이터 수집" desc="평일 06:30 인포맥스/Bloomberg 자동 수집">
          <Toggle value={auto} onChange={setAuto} />
        </Row>
        <Row label="모닝브리프 자동 생성" desc="매일 07:00 일간 리포트 자동 생성">
          <Toggle value={auto} onChange={setAuto} />
        </Row>
        <Row label="수집 시간">
          <input type="time" defaultValue="06:30"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
        <Row label="자동 생성 시간">
          <input type="time" defaultValue="07:00"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
      </Section>

      <Section icon={Bell} title="알림">
        <Row label="이상치 탐지 알림" desc="전일 대비 ±3σ 이상 변동 시 알림">
          <Toggle value={notify} onChange={setNotify} />
        </Row>
        <Row label="데이터 수집 실패 알림">
          <Toggle value={notify} onChange={setNotify} />
        </Row>
        <Row label="임계치 설정 (VIX)">
          <input type="number" defaultValue={25} min={10} max={80}
            className="w-20 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
      </Section>

      <Section icon={Mail} title="배포 설정">
        <Row label="이메일 자동 발송" desc="리포트 승인 후 자동 이메일 발송">
          <Toggle value={emailSend} onChange={setEmailSend} />
        </Row>
        <Row label="카카오워크 연동" desc="카카오워크 채널 자동 발송">
          <Toggle value={kakao} onChange={setKakao} />
        </Row>
        <Row label="기본 수신자 그룹">
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option>자금시장부 전체</option>
            <option>본부장 + 부행장</option>
            <option>자금시장부 팀장 이상</option>
          </select>
        </Row>
      </Section>

      <Section icon={Users} title="사용자 정보">
        <Row label="기본 작성자명">
          <input type="text" defaultValue="김철수"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
        <Row label="소속 부서">
          <input type="text" defaultValue="자금시장부"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
        <Row label="기본 문서 등급">
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option>내부용</option><option>대외비</option><option>비밀</option>
          </select>
        </Row>
      </Section>

      <Section icon={Shield} title="리포트 설정">
        <Row label="다크 헤더 스타일" desc="A4 리포트 헤더에 네이비 배경 사용">
          <Toggle value={darkHeader} onChange={setDarkHeader} />
        </Row>
        <Row label="워터마크 삽입" desc="'iM뱅크 자금시장부 내부용' 워터마크">
          <Toggle value={watermark} onChange={setWatermark} />
        </Row>
        <Row label="데이터 소스 주석" desc="모든 수치에 데이터 소스 자동 태깅">
          <Toggle value={true} onChange={() => {}} />
        </Row>
      </Section>

      <Section icon={Palette} title="외관">
        <Row label="사이드바 스타일">
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option>다크 네이비 (기본)</option>
            <option>라이트</option>
          </select>
        </Row>
        <Row label="로고 / 은행명">
          <input type="text" defaultValue="iM뱅크"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-navy-600" />
        </Row>
      </Section>

      <div className="flex justify-end gap-3 pt-2">
        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">초기화</button>
        <button className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors">저장</button>
      </div>
    </div>
  )
}
