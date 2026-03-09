import { useState, useEffect } from 'react'
import { Key, Database, Mail, CheckCircle, XCircle, TrendingUp, ChevronRight, Eye, EyeOff } from 'lucide-react'

interface KeyStatus {
  anthropic: boolean
  ecos: boolean
  fred: boolean
  smtp: boolean
}

interface Props {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: Props) {
  const [status, setStatus]           = useState<KeyStatus>({ anthropic: false, ecos: false, fred: false, smtp: false })
  const [anthropicKey, setAnthropicKey] = useState('')
  const [ecosKey, setEcosKey]         = useState('')
  const [fredKey, setFredKey]         = useState('')
  const [smtpHost, setSmtpHost]       = useState('')
  const [smtpPort, setSmtpPort]       = useState('587')
  const [smtpUser, setSmtpUser]       = useState('')
  const [smtpPass, setSmtpPass]       = useState('')
  const [smtpFrom, setSmtpFrom]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then((d: KeyStatus) => setStatus(d))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropicKey, ecosKey, fredKey, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom }),
      })
      if (!res.ok) throw new Error('저장 실패')
      setSaved(true)
      setTimeout(() => {
        localStorage.setItem('setup_complete', '1')
        onComplete()
      }, 900)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('setup_complete', '1')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 flex items-center justify-center p-4" style={{ background: 'rgba(4,11,30,0.95)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-navy-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">iMBank Trading Desk</div>
              <div className="text-slate-400 text-xs mt-0.5">초기 설정 — API 키 구성</div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-4 leading-relaxed">
            사용할 API 키를 입력하고 저장하세요. 이미 설정된 항목은 빈칸으로 두면 기존 값을 유지합니다.
            지금 건너뛰면 현재 <code className="bg-navy-800 px-1 rounded text-slate-300">.env</code> 값을 그대로 사용합니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Claude AI */}
          <Section
            icon={<Key className="w-4 h-4" />}
            title="Claude AI (Anthropic)"
            desc="마켓 내러티브 AI 생성에 필요합니다"
            ok={status.anthropic}
          >
            <SecretInput
              label="API Key"
              value={anthropicKey}
              onChange={setAnthropicKey}
              placeholder={status.anthropic ? '현재 키 유지 (변경 시 입력)' : 'sk-ant-...'}
            />
          </Section>

          {/* 시장 데이터 */}
          <Section
            icon={<Database className="w-4 h-4" />}
            title="시장 데이터 API"
            desc="금리·환율 자동 수집에 필요합니다"
            ok={status.ecos && status.fred}
          >
            <SecretInput
              label="ECOS API Key (한국은행)"
              value={ecosKey}
              onChange={setEcosKey}
              placeholder={status.ecos ? '현재 키 유지' : 'ECOS API Key'}
            />
            <SecretInput
              label="FRED API Key (미 연준)"
              value={fredKey}
              onChange={setFredKey}
              placeholder={status.fred ? '현재 키 유지' : 'FRED API Key'}
            />
          </Section>

          {/* SMTP */}
          <Section
            icon={<Mail className="w-4 h-4" />}
            title="이메일 (SMTP) — 선택"
            desc="리포트 이메일 발송 시 설정하세요"
            ok={status.smtp}
          >
            <FieldInput label="SMTP 호스트" value={smtpHost} onChange={setSmtpHost} placeholder={status.smtp ? '현재 값 유지' : 'smtp.gmail.com'} />
            <div className="grid grid-cols-2 gap-2">
              <FieldInput label="포트" value={smtpPort} onChange={setSmtpPort} placeholder="587" />
              <FieldInput label="발신자명" value={smtpFrom} onChange={setSmtpFrom} placeholder="Trading Desk" />
            </div>
            <FieldInput label="이메일 계정" value={smtpUser} onChange={setSmtpUser} placeholder={status.smtp ? '현재 값 유지' : 'your@email.com'} />
            <SecretInput label="비밀번호 / 앱 패스워드" value={smtpPass} onChange={setSmtpPass} placeholder={status.smtp ? '현재 값 유지' : '앱 패스워드'} />
          </Section>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 space-y-2">
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              건너뛰기 (현재 키 유지)
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex-1 flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saved
                ? <><CheckCircle className="w-4 h-4" /> 저장 완료</>
                : saving
                  ? '저장 중...'
                  : <><ChevronRight className="w-4 h-4" /> 저장 후 시작</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, desc, ok, children }: {
  icon: React.ReactNode; title: string; desc: string; ok: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="text-navy-900 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{title}</span>
            {ok
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            }
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="space-y-2 pl-6">{children}</div>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
      />
    </div>
  )
}

function SecretInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
