import { useRef, useState } from 'react'
import { downloadPdf, saveReport, emailReport, printReport, type ReportMeta } from '../utils/pdfExport'

export type { ReportMeta }

export function useReportActions(meta: ReportMeta) {
  const printRef = useRef<HTMLDivElement>(null)

  // ── 리포트 생성 상태 ──────────────────────────────────────────────────────
  const [narrative, setNarrative]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError]     = useState('')

  const isReady = !!narrative && !generating

  // ── 액션 상태 ────────────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [savedAt, setSavedAt]         = useState<string | null>(null)
  const [emailOpen, setEmailOpen]     = useState(false)
  const [emailing, setEmailing]       = useState(false)
  const [actionError, setActionError] = useState('')

  const handleDownload = async () => {
    if (!printRef.current || !isReady) return
    setDownloading(true)
    setActionError('')
    try {
      await downloadPdf(printRef.current, `${meta.type}-${meta.date}.pdf`)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '다운로드 실패')
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    if (!printRef.current || !isReady) return
    setSaving(true)
    setActionError('')
    try {
      await saveReport(printRef.current, meta)
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleEmail = async (recipients: string[], subject: string) => {
    if (!printRef.current || !isReady) return
    setEmailing(true)
    setActionError('')
    try {
      await emailReport(printRef.current, meta, recipients, subject)
      setEmailOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '이메일 발송 실패')
    } finally {
      setEmailing(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current || !isReady) return
    printReport(printRef.current, meta.title)
  }

  return {
    printRef,
    // 생성
    narrative, setNarrative,
    generating, setGenerating,
    genError, setGenError,
    isReady,
    // 액션
    downloading, saving, savedAt, emailOpen, setEmailOpen, emailing,
    actionError, setActionError,
    handleDownload, handleSave, handleEmail, handlePrint,
  }
}
