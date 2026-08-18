import type { WatchlistEntry } from './types'

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export function serializeWatchlistCsv(entries: WatchlistEntry[]): string {
  const rows = entries.map((entry) =>
    [entry.address, entry.label, entry.tags.join('|')].map(csvCell).join(','),
  )
  return ['address,label,tags', ...rows].join('\n') + (rows.length ? '\n' : '')
}

export function parseWatchlistCsv(text: string, now = Date.now()): WatchlistEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) {
    return []
  }

  const start = /^address\s*,\s*label/i.test(lines[0]) ? 1 : 0
  const entries: WatchlistEntry[] = []
  const seen = new Set<string>()

  for (const [index, line] of lines.slice(start).entries()) {
    const parts = splitCsvLine(line)
    const address = (parts[0] ?? '').trim()
    if (!address || seen.has(address.toLowerCase())) {
      continue
    }
    seen.add(address.toLowerCase())
    entries.push({
      id: `imported-${index + 1}-${address.slice(0, 8)}`,
      address,
      label: (parts[1] ?? '').trim() || `Wallet ${entries.length + 1}`,
      tags: (parts[2] ?? '')
        .split(/[|,]/)
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      addedAt: now - index,
    })
  }

  return entries
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}
