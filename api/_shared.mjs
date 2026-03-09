// Shared utilities for Vercel narrative API functions

export const NEWS_FEEDS = [
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://www.yonhapnews.co.kr/rss/economy.xml',
  'https://rss.hankyung.com/economy.xml',
]

export async function fetchRecentNews() {
  const headlines = []
  for (const url of NEWS_FEEDS) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MktDesk/1.0)' },
      })
      if (!r.ok) continue
      const xml = await r.text()
      let titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]{5,200})\]\]><\/title>/g)].map(m => m[1].trim())
      if (!titles.length) {
        titles = [...xml.matchAll(/<title>([^<]{5,200})<\/title>/g)]
          .map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim())
      }
      const filtered = titles.slice(1).filter(t => !t.startsWith('http') && t.length > 5)
      headlines.push(...filtered.slice(0, 4))
      if (headlines.length >= 8) break
    } catch { /* skip */ }
  }
  return headlines.slice(0, 8)
}

export function newsBlock(headlines) {
  if (!headlines?.length) return ''
  return `\n■ 최근 주요 뉴스 헤드라인\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`
}

export function geoBlock(geoContext) {
  if (!geoContext?.trim()) return ''
  return `\n■ 주요 이슈 / 지정학적 이벤트\n${geoContext.trim()}\n`
}

export function bp(v) { return v > 0 ? `+${v}bp` : `${v}bp` }
export function chg(v, d = 1) { return v > 0 ? `+${v.toFixed(d)}` : v.toFixed(d) }

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
}
