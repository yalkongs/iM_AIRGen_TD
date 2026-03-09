import { Download, Save, Mail, Printer, AlertCircle, Check } from 'lucide-react'
import EmailDialog from './EmailDialog'

interface Props {
  isReady: boolean
  downloading: boolean
  saving: boolean
  savedAt: string | null
  emailing: boolean
  emailOpen: boolean
  setEmailOpen: (v: boolean) => void
  actionError: string
  handleDownload: () => void
  handleSave: () => void
  handlePrint: () => void
  handleEmail: (recipients: string[], subject: string) => Promise<void>
  defaultEmailSubject: string
}

export default function ReportActionsPanel({
  isReady, downloading, saving, savedAt, emailing, emailOpen, setEmailOpen, actionError,
  handleDownload, handleSave, handlePrint, handleEmail, defaultEmailSubject,
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <button
          onClick={handlePrint}
          disabled={!isReady}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" /> 인쇄 / PDF 저장
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            disabled={!isReady || downloading}
            className="flex flex-col items-center gap-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? '...' : 'PDF'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isReady || saving}
            className="flex flex-col items-center gap-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? '...' : '저장'}
          </button>
          <button
            onClick={() => setEmailOpen(true)}
            disabled={!isReady}
            className="flex flex-col items-center gap-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            이메일
          </button>
        </div>
        {savedAt && (
          <div className="flex items-center justify-center gap-1 text-xs text-emerald-600">
            <Check className="w-3 h-3" /> 아카이브 저장 ({savedAt})
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3 h-3 shrink-0" />{actionError}
          </div>
        )}
        {!isReady && (
          <p className="text-xs text-slate-400 text-center">Report Generation 후 활성화됩니다</p>
        )}
      </div>

      {emailOpen && (
        <EmailDialog
          defaultSubject={defaultEmailSubject}
          onSend={handleEmail}
          onClose={() => setEmailOpen(false)}
          sending={emailing}
        />
      )}
    </>
  )
}
