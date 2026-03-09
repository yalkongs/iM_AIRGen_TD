import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, BarChart2, BookOpen, Zap, Eye, Download, Trash2, RefreshCw } from 'lucide-react'

interface ReportEntry {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'adhoc'
  title: string
  date: string
  author: string
  classification: string
  createdAt: string
}

const TYPE_META: Record<string, { icon: React.ElementType, label: string, color: string, bg: string }> = {
  daily:   { icon: FileText,  label: '일간', color: 'text-blue-600',   bg: 'bg-blue-50'   },
  weekly:  { icon: BarChart2, label: '주간', color: 'text-green-600',  bg: 'bg-green-50'  },
  monthly: { icon: BookOpen,  label: '월간', color: 'text-purple-600', bg: 'bg-purple-50' },
  adhoc:   { icon: Zap,       label: '수시', color: 'text-amber-600',  bg: 'bg-amber-50'  },
}

export default function Archive() {
  const [reports, setReports]   = useState<ReportEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState<'all' | ReportEntry['type']>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      const data = await res.json() as ReportEntry[]
      setReports(data)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('리포트를 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' })
      setReports(prev => prev.filter(r => r.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleViewPdf = (id: string) => {
    window.open(`/api/reports/${id}/pdf`, '_blank')
  }

  const handleDownloadPdf = (id: string, title: string) => {
    const a = document.createElement('a')
    a.href = `/api/reports/${id}/pdf`
    a.download = `${title}.pdf`
    a.click()
  }

  const filtered = reports.filter(r => {
    const matchType  = filter === 'all' || r.type === filter
    const matchQuery = r.title.includes(query) || r.author.includes(query)
    return matchType && matchQuery
  })

  return (
    <div className="p-4 md:p-6 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">리포트 아카이브</h2>
          <p className="text-sm text-slate-500 mt-0.5">생성된 리포트 전체 이력 조회</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">{filtered.length}건</div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 & 검색 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="제목, 작성자 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'daily', 'weekly', 'monthly', 'adhoc'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === t ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {t === 'all' ? '전체' : TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* 리포트 목록 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2.5 border-b border-slate-100">
          <div className="col-span-1">유형</div>
          <div className="col-span-5">제목</div>
          <div className="col-span-2 hidden sm:block">기준일</div>
          <div className="col-span-2 hidden md:block">작성자</div>
          <div className="col-span-2 hidden sm:block">저장시각</div>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {reports.length === 0 ? '저장된 리포트가 없습니다. Report Generation 후 저장 버튼을 누르세요.' : '검색 결과가 없습니다.'}
            </div>
          ) : filtered.map(r => {
            const meta = TYPE_META[r.type]
            const Icon = meta.icon
            return (
              <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50 transition-colors group">
                <div className="col-span-1">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${meta.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  </span>
                </div>
                <div className="col-span-6 sm:col-span-5">
                  <div className="text-sm font-medium text-slate-800 truncate">{r.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 sm:hidden">{r.date} · {r.author}</div>
                </div>
                <div className="col-span-2 hidden sm:block text-sm text-slate-500">{r.date}</div>
                <div className="col-span-2 hidden md:block text-sm text-slate-500">{r.author}</div>
                <div className="col-span-1 hidden sm:block text-xs text-slate-400 truncate">{r.createdAt}</div>
                <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleViewPdf(r.id)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    title="미리보기"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(r.id, r.title)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    title="다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const count = reports.filter(r => r.type === type).length
          const Icon = meta.icon
          return (
            <div key={type} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <span className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </span>
              <div>
                <div className="text-lg font-bold text-slate-800">{count}</div>
                <div className="text-xs text-slate-500">{meta.label} 리포트</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
