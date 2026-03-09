const KEY = 'claude_api_key'

export function getClaudeApiKey(): string {
  return localStorage.getItem(KEY) || ''
}

export function setClaudeApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(KEY, key.trim())
  } else {
    localStorage.removeItem(KEY)
  }
}

export function hasClaudeApiKey(): boolean {
  return !!localStorage.getItem(KEY)
}
