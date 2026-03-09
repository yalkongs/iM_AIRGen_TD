import html2pdf from 'html2pdf.js'

const PDF_OPTS = {
  margin: 0,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
}

// ── PDF 다운로드 (로컬 파일 저장) ────────────────────────────────────────────
export async function downloadPdf(element: HTMLElement, filename: string): Promise<void> {
  await html2pdf().set({ ...PDF_OPTS, filename }).from(element).save()
}

// ── PDF Blob 생성 ────────────────────────────────────────────────────────────
export async function getPdfBlob(element: HTMLElement): Promise<Blob> {
  return await html2pdf().set(PDF_OPTS).from(element).outputPdf('blob')
}

// ── Blob → base64 변환 ───────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

// ── 아카이브 저장 ─────────────────────────────────────────────────────────────
export interface ReportMeta {
  type: 'daily' | 'weekly' | 'monthly' | 'adhoc'
  title: string
  date: string
  author: string
  classification: string
}

export async function saveReport(element: HTMLElement, meta: ReportMeta): Promise<string> {
  const blob = await getPdfBlob(element)
  const pdfBase64 = await blobToBase64(blob)
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta, pdfBase64 }),
  })
  if (!res.ok) throw new Error('아카이브 저장에 실패했습니다.')
  const data = await res.json() as { id: string }
  return data.id
}

// ── 이메일 발송 (저장 없이 직접) ────────────────────────────────────────────
export async function emailReport(
  element: HTMLElement,
  meta: ReportMeta,
  recipients: string[],
  subject: string
): Promise<void> {
  const blob = await getPdfBlob(element)
  const pdfBase64 = await blobToBase64(blob)
  const res = await fetch('/api/reports/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64, meta, recipients, subject }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || '이메일 발송에 실패했습니다.')
  }
}

// ── 공통 인쇄 ────────────────────────────────────────────────────────────────
export function printReport(element: HTMLElement, title: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html lang="ko"><head>
    <meta charset="UTF-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Noto Sans KR', sans-serif; font-size: 10pt; color: #1a1a2e; background: white; }
      .a4-page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; position: relative; }
      h2 { font-size: 11pt; font-weight: 700; color: #0d1b3e; border-left: 4px solid #c9a227; padding-left: 8px; margin: 16px 0 8px; }
      h3 { font-size: 10pt; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; }
      th { background: #0d1b3e; color: white; padding: 4px 8px; text-align: center; font-weight: 600; }
      td { padding: 3px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
      td:first-child { text-align: left; }
      tr:nth-child(even) td { background: #f8fafc; }
      .val-up { color: #dc2626; } .val-down { color: #16a34a; } .val-flat { color: #64748b; }
    </style>
  </head><body><div class="a4-page">${element.innerHTML}</div></body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 500)
}
