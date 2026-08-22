import { screenAddress } from './sanctions'
import type { ChainId } from './types'
import { hashText, riskTone, scoreLabel } from './utils'
import { makeFlowNode, shortAddress } from './flowGraph'

export type CaseStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'
export type CasePriority = 'low' | 'medium' | 'high'

export interface CaseNote {
  id: string
  text: string
  createdAt: number
}

export interface CaseAddress {
  address: string
  chain: ChainId
  addedAt: number
}

export interface InvestigationCase {
  id: string
  title: string
  summary: string
  status: CaseStatus
  priority: CasePriority
  addresses: CaseAddress[]
  notes: CaseNote[]
  createdAt: number
  updatedAt: number
}

export const CASE_STATUSES: CaseStatus[] = ['open', 'investigating', 'resolved', 'dismissed']
export const CASE_PRIORITIES: CasePriority[] = ['low', 'medium', 'high']

export function createCase(
  title: string,
  options: { summary?: string; priority?: CasePriority; now?: number } = {},
): InvestigationCase {
  const trimmed = title.trim()
  if (!trimmed) {
    throw new Error('Case title is required')
  }
  const now = options.now ?? Date.now()
  return {
    id: `case-${now.toString(36)}-${hashText(`${trimmed}-${now}`).toString(36)}`,
    title: trimmed,
    summary: options.summary?.trim() ?? '',
    status: 'open',
    priority: options.priority ?? 'medium',
    addresses: [],
    notes: [],
    createdAt: now,
    updatedAt: now,
  }
}

function touch(item: InvestigationCase, now?: number): InvestigationCase {
  return { ...item, updatedAt: now ?? Date.now() }
}

/** Add an address to a case; duplicates (same address + chain) are ignored. */
export function addAddressToCase(
  item: InvestigationCase,
  address: string,
  chain: ChainId,
  now?: number,
): InvestigationCase {
  const normalized = address.trim().toLowerCase()
  if (!normalized) return item
  const exists = item.addresses.some(
    (entry) => entry.address.toLowerCase() === normalized && entry.chain === chain,
  )
  if (exists) return item
  return touch(
    {
      ...item,
      addresses: [...item.addresses, { address: address.trim(), chain, addedAt: now ?? Date.now() }],
    },
    now,
  )
}

export function removeAddressFromCase(item: InvestigationCase, address: string, chain: ChainId): InvestigationCase {
  const normalized = address.toLowerCase()
  const next = item.addresses.filter(
    (entry) => !(entry.address.toLowerCase() === normalized && entry.chain === chain),
  )
  if (next.length === item.addresses.length) return item
  return touch({ ...item, addresses: next })
}

export function addNoteToCase(item: InvestigationCase, text: string, now?: number): InvestigationCase {
  const trimmed = text.trim()
  if (!trimmed) return item
  const timestamp = now ?? Date.now()
  const note: CaseNote = {
    id: `note-${timestamp.toString(36)}-${hashText(`${trimmed}-${timestamp}`).toString(36)}`,
    text: trimmed,
    createdAt: timestamp,
  }
  return touch({ ...item, notes: [note, ...item.notes] }, now)
}

export function setCaseStatus(item: InvestigationCase, status: CaseStatus, now?: number): InvestigationCase {
  if (item.status === status) return item
  return touch({ ...item, status }, now)
}

export function setCasePriority(item: InvestigationCase, priority: CasePriority, now?: number): InvestigationCase {
  if (item.priority === priority) return item
  return touch({ ...item, priority }, now)
}

export interface CaseRiskRollup {
  addressCount: number
  highestRisk: number
  sanctionHits: number
  watchlisted: number
  tone: ReturnType<typeof riskTone>
}

/** Aggregate risk across every address attached to the case. */
export function summarizeCaseRisk(item: InvestigationCase): CaseRiskRollup {
  let highestRisk = 0
  let sanctionHits = 0
  let watchlisted = 0

  for (const entry of item.addresses) {
    const node = makeFlowNode(entry.address, entry.chain, 0)
    highestRisk = Math.max(highestRisk, node.riskScore)
    if (node.sanction === 'hit') sanctionHits++
    else if (node.sanction === 'watch') watchlisted++
  }

  return {
    addressCount: item.addresses.length,
    highestRisk,
    sanctionHits,
    watchlisted,
    tone: riskTone(highestRisk),
  }
}

/** Render a case as a portable Markdown report. */
export function caseToMarkdown(item: InvestigationCase, now = Date.now()): string {
  const rollup = summarizeCaseRisk(item)
  const lines: string[] = [
    `# Investigation: ${item.title}`,
    '',
    `- **Status:** ${item.status}`,
    `- **Priority:** ${item.priority}`,
    `- **Opened:** ${new Date(item.createdAt).toISOString()}`,
    `- **Last updated:** ${new Date(item.updatedAt).toISOString()}`,
    `- **Exported:** ${new Date(now).toISOString()}`,
    '',
  ]

  if (item.summary) {
    lines.push(item.summary, '')
  }

  lines.push(
    '## Risk rollup',
    '',
    `- Addresses tracked: ${rollup.addressCount}`,
    `- Highest risk score: ${rollup.highestRisk} (${scoreLabel(rollup.highestRisk)})`,
    `- Sanctions hits: ${rollup.sanctionHits}`,
    `- Sanctions watch matches: ${rollup.watchlisted}`,
    '',
  )

  if (item.addresses.length > 0) {
    lines.push('## Addresses', '', '| Address | Chain | Risk | Sanctions |', '|---------|-------|------|-----------|')
    for (const entry of item.addresses) {
      const node = makeFlowNode(entry.address, entry.chain, 0)
      const screen = screenAddress(entry.address)
      const sanctions = screen.status === 'clear' ? 'clear' : `${screen.status} (${screen.lists.join(', ')})`
      lines.push(`| \`${shortAddress(entry.address)}\` | ${entry.chain} | ${node.riskScore} | ${sanctions} |`)
    }
    lines.push('')
  }

  if (item.notes.length > 0) {
    lines.push('## Notes', '')
    for (const note of [...item.notes].reverse()) {
      lines.push(`- _${new Date(note.createdAt).toISOString()}_ — ${note.text}`)
    }
    lines.push('')
  }

  lines.push('---', '_Generated by ChainWatch Pro._')
  return lines.join('\n')
}

export function sortCases(cases: InvestigationCase[]): InvestigationCase[] {
  const priorityRank: Record<CasePriority, number> = { high: 0, medium: 1, low: 2 }
  const statusRank: Record<CaseStatus, number> = { open: 0, investigating: 1, resolved: 2, dismissed: 3 }
  return [...cases].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      priorityRank[a.priority] - priorityRank[b.priority] ||
      b.updatedAt - a.updatedAt,
  )
}
