import { validateAddress } from './address'
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

/**
 * Splits CSV text into records of cells.
 *
 * Records are found by scanning character by character rather than by splitting
 * on newlines first: a quoted cell may legitimately contain `,` *and* a line
 * break, and `serializeWatchlistCsv` emits exactly that for multi-line labels.
 * The previous line-first parser tore such a row apart and imported the tail of
 * the label as an extra wallet address.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = []
  let cells: string[] = []
  let current = ''
  let inQuotes = false

  const endCell = () => {
    cells.push(current)
    current = ''
  }
  const endRecord = () => {
    endCell()
    records.push(cells)
    cells = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
        continue
      }
      current += char
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === ',') {
      endCell()
      continue
    }
    if (char === '\r') {
      if (text[i + 1] === '\n') i += 1
      endRecord()
      continue
    }
    if (char === '\n') {
      endRecord()
      continue
    }
    current += char
  }

  if (current !== '' || cells.length > 0) {
    endRecord()
  }

  return records.filter((record) => record.some((cell) => cell.trim() !== ''))
}

export function parseWatchlistCsv(text: string, now = Date.now()): WatchlistEntry[] {
  const records = parseCsvRecords(text)
  if (records.length === 0) {
    return []
  }

  const header = records[0]
  const hasHeader =
    /^address$/i.test((header[0] ?? '').trim()) && /^label$/i.test((header[1] ?? '').trim())
  const rows = hasHeader ? records.slice(1) : records

  const entries: WatchlistEntry[] = []
  const seen = new Set<string>()

  for (const [index, parts] of rows.entries()) {
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

export interface RejectedRow {
  /** 1-based row number in the file, header included, for pointing at the CSV. */
  row: number
  value: string
  reason: string
}

export interface WatchlistImportReport {
  entries: WatchlistEntry[]
  rejected: RejectedRow[]
  /** Rows skipped because the address was already known. */
  duplicates: number
}

/**
 * Parses a CSV import and says what it refused.
 *
 * The plain parser silently dropped any row it could not use, so importing a
 * file with a mistyped address looked identical to a clean import — the wallet
 * simply was not there. This reports every rejection with a reason, validates
 * each address, and stores the canonical (checksummed) form.
 */
export function importWatchlistCsv(
  text: string,
  { now = Date.now(), existing = [] as string[] } = {},
): WatchlistImportReport {
  const records = parseCsvRecords(text)
  if (records.length === 0) {
    return { entries: [], rejected: [], duplicates: 0 }
  }

  const header = records[0]
  const hasHeader =
    /^address$/i.test((header[0] ?? '').trim()) && /^label$/i.test((header[1] ?? '').trim())
  const rows = hasHeader ? records.slice(1) : records
  const rowOffset = hasHeader ? 2 : 1

  const entries: WatchlistEntry[] = []
  const rejected: RejectedRow[] = []
  const seen = new Set(existing.map((address) => address.trim().toLowerCase()))
  let duplicates = 0

  rows.forEach((parts, index) => {
    const row = index + rowOffset
    const raw = (parts[0] ?? '').trim()

    const check = validateAddress(raw)
    if (!check.valid) {
      rejected.push({ row, value: raw, reason: check.message ?? 'Invalid address' })
      return
    }

    const key = check.normalized.toLowerCase()
    if (seen.has(key)) {
      duplicates += 1
      return
    }
    seen.add(key)

    entries.push({
      id: `imported-${row}-${check.normalized.slice(0, 8)}`,
      address: check.normalized,
      label: (parts[1] ?? '').trim() || `Wallet ${entries.length + 1}`,
      tags: (parts[2] ?? '')
        .split(/[|,]/)
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      addedAt: now - index,
    })
  })

  return { entries, rejected, duplicates }
}
