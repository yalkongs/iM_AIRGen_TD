import { useState } from 'react'
import { X, Send, Plus, Trash2 } from 'lucide-react'

interface Props {
  defaultSubject: string
  onSend: (recipients: string[], subject: string) => Promise<void>
  onClose: () => void
  sending: boolean
}

export default function EmailDialog({ defaultSubject, onSend, onClose, sending }: Props) {
  const [subject, setSubject]       = useState(defaultSubject)
  const [input, setInput]           = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [error, setError]           = useState('')

  const addRecipient = () => {
    const email = input.trim()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('유효하지 않은 이메일 주소입니다.')
      return
    }
    if (recipients.includes(email)) {
      setError('이미 추가된 주소입니다.')
      return
    }
    setRecipients(r => [...r, email])
    setInput('')
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addRecipient() }
  }

  const handleSend = async () => {
    if (!recipients.length) { setError('수신자를 한 명 이상 추가해주세요.'); return }
    await onSend(recipients, subject)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-navy-900" />
            <span className="font-semibold text-slate-800">이메일 발송</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">제목</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* 수신자 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">수신자</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="이메일 주소 입력 후 Enter"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
              <button
                onClick={addRecipient}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* 수신자 목록 */}
          {recipients.length > 0 && (
            <div className="space-y-1.5">
              {recipients.map(r => (
                <div key={r} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-slate-700">{r}</span>
                  <button onClick={() => setRecipients(list => list.filter(x => x !== r))} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              취소
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !recipients.length}
              className="flex-1 flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? '발송 중...' : `발송 (${recipients.length}명)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
