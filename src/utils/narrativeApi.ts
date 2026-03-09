import type { MarketSnapshot, EconomicEvent } from '../types'
import { getClaudeApiKey } from './apiKeyStore'

async function postNarrative(path: string, body: object): Promise<string> {
  const apiKey = getClaudeApiKey()
  if (!apiKey) {
    throw new Error('__NO_API_KEY__')
  }
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || '서버 오류')
  }
  const data = await res.json()
  return (data as { narrative: string }).narrative
}

export function fetchDailyNarrative(
  snapshot: MarketSnapshot,
  events: EconomicEvent[],
  geoContext = ''
): Promise<string> {
  return postNarrative('/api/narrative/daily', { snapshot, events, geoContext })
}

export function fetchWeeklyNarrative(
  snapshot: MarketSnapshot,
  weekEvents: EconomicEvent[],
  geoContext = ''
): Promise<string> {
  return postNarrative('/api/narrative/weekly', { snapshot, weekEvents, geoContext })
}

export function fetchMonthlyNarrative(
  snapshot: MarketSnapshot,
  targetMonth: string,
  geoContext = ''
): Promise<string> {
  return postNarrative('/api/narrative/monthly', { snapshot, targetMonth, geoContext })
}

export function fetchAdHocNarrative(
  snapshot: MarketSnapshot,
  templateType: string,
  topicDesc: string,
  geoContext = ''
): Promise<string> {
  return postNarrative('/api/narrative/adhoc', { snapshot, templateType, topicDesc, geoContext })
}
