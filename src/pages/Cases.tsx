import clsx from 'clsx'
import { Download, FolderKanban, FolderPlus, NotebookPen, Trash2, Waypoints } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  addNoteToCase,
  caseToMarkdown,
  createCase,
  removeAddressFromCase,
  setCasePriority,
  setCaseStatus,
  sortCases,
  summarizeCaseRisk,
  CASE_PRIORITIES,
  CASE_STATUSES,
  type CasePriority,
  type CaseStatus,
  type InvestigationCase,
} from '../lib/cases'
import { shortAddress } from '../lib/flowGraph'
import { formatTimeAgo, scoreLabel } from '../lib/utils'

const NO_CASES: InvestigationCase[] = []

export function Cases() {
  const [cases, setCases] = useLocalStorage<InvestigationCase[]>('chainwatch-cases', NO_CASES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPriority, setDraftPriority] = useState<CasePriority>('medium')
  const [noteDraft, setNoteDraft] = useState('')

  const visibleCases = useMemo(() => {
    const sorted = sortCases(cases)
    return statusFilter === 'all' ? sorted : sorted.filter((item) => item.status === statusFilter)
  }, [cases, statusFilter])

  const selected = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId])

  const updateCase = (id: string, updater: (item: InvestigationCase) => InvestigationCase) => {
    setCases((current) => current.map((item) => (item.id === id ? updater(item) : item)))
  }

  const submitCase = () => {
    try {
      const item = createCase(draftTitle, { priority: draftPriority })
      setCases((current) => [item, ...current])
      setDraftTitle('')
      setSelectedId(item.id)
      toast.success(`Case “${item.title}” opened`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    }
  }

  const submitNote = () => {
    if (!selected) return
    if (!noteDraft.trim()) {
      toast.error('Write a note first')
      return
    }
    updateCase(selected.id, (item) => addNoteToCase(item, noteDraft))
    setNoteDraft('')
  }

  const deleteCase = (id: string) => {
    const target = cases.find((item) => item.id === id)
    setCases((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast.success(`Case “${target?.title ?? ''}” deleted`)
  }

  const exportMarkdown = () => {
    if (!selected) return
    const blob = new Blob([caseToMarkdown(selected)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `chainwatch-case-${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Case report exported')
  }

  return (
    <div className="page cases-page">
      <section className="panel">
        <SectionTitle icon={FolderKanban} eyebrow="Investigations" title="Case management" />
        <p className="panel-sub">
          Group suspicious addresses into cases, keep an evidence trail, and export a report when you hand off.
          Attach addresses from the <Link to="/explorer">flow explorer</Link>.
        </p>

        <div className="cases-toolbar">
          <div className="cases-create">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitCase()}
              placeholder="New case title…"
              aria-label="New case title"
            />
            <select
              value={draftPriority}
              onChange={(event) => setDraftPriority(event.target.value as CasePriority)}
              aria-label="New case priority"
            >
              {CASE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <button type="button" className="primary-button" onClick={submitCase}>
              <FolderPlus size={16} aria-hidden="true" />
              Open case
            </button>
          </div>

          <div className="cases-filter" role="tablist" aria-label="Filter by status">
            {(['all', ...CASE_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={statusFilter === status}
                className={clsx({ active: statusFilter === status })}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="cases-body">
          <ul className="cases-list">
            {visibleCases.length === 0 ? (
              <li className="cases-empty">No cases yet — open one above, or add addresses from the Explorer.</li>
            ) : (
              visibleCases.map((item) => {
                const rollup = summarizeCaseRisk(item)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={clsx('case-row', { selected: item.id === selectedId })}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <span>
                          {rollup.addressCount} address{rollup.addressCount === 1 ? '' : 'es'} ·{' '}
                          {item.notes.length} note{item.notes.length === 1 ? '' : 's'} · updated{' '}
                          {formatTimeAgo(item.updatedAt)}
                        </span>
                      </div>
                      <div className="case-row-meta">
                        <span className={clsx('case-chip', `priority-${item.priority}`)}>{item.priority}</span>
                        <span className={clsx('case-chip', `status-${item.status}`)}>{item.status}</span>
                        {rollup.sanctionHits > 0 ? (
                          <span className="case-chip sanctions">⚠ {rollup.sanctionHits}</span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {selected ? (
            <article className="case-detail">
              <header>
                <h3>{selected.title}</h3>
                <div className="case-detail-controls">
                  <label>
                    <span>Status</span>
                    <select
                      value={selected.status}
                      onChange={(event) =>
                        updateCase(selected.id, (item) => setCaseStatus(item, event.target.value as CaseStatus))
                      }
                    >
                      {CASE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Priority</span>
                    <select
                      value={selected.priority}
                      onChange={(event) =>
                        updateCase(selected.id, (item) => setCasePriority(item, event.target.value as CasePriority))
                      }
                    >
                      {CASE_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="secondary-button" onClick={exportMarkdown}>
                    <Download size={15} aria-hidden="true" />
                    Export report
                  </button>
                  <button
                    type="button"
                    className="secondary-button danger"
                    onClick={() => deleteCase(selected.id)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </header>

              <section>
                <h4>Addresses</h4>
                {selected.addresses.length === 0 ? (
                  <p className="case-hint">
                    None attached yet. Open the <Link to="/explorer">Explorer</Link>, select a node, and use “Add
                    to case”.
                  </p>
                ) : (
                  <table className="case-address-table">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Chain</th>
                        <th>Risk</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.addresses.map((entry) => {
                        const rollup = summarizeCaseRisk({ ...selected, addresses: [entry] })
                        return (
                          <tr key={`${entry.chain}-${entry.address}`}>
                            <td>
                              <code title={entry.address}>{shortAddress(entry.address)}</code>
                            </td>
                            <td>{entry.chain}</td>
                            <td>
                              <span className={clsx('status-pill', rollup.tone)}>
                                {rollup.highestRisk} · {scoreLabel(rollup.highestRisk)}
                              </span>
                            </td>
                            <td className="case-address-actions">
                              <Link
                                className="icon-button"
                                to={`/explorer?address=${encodeURIComponent(entry.address)}&chain=${entry.chain}`}
                                title="Open in Explorer"
                                aria-label="Open in Explorer"
                              >
                                <Waypoints size={15} aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                className="icon-button"
                                title="Remove from case"
                                aria-label="Remove from case"
                                onClick={() =>
                                  updateCase(selected.id, (item) =>
                                    removeAddressFromCase(item, entry.address, entry.chain),
                                  )
                                }
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </section>

              <section>
                <h4>Notes</h4>
                <div className="case-note-form">
                  <input
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && submitNote()}
                    placeholder="Add an investigation note…"
                    aria-label="New note"
                  />
                  <button type="button" className="secondary-button" onClick={submitNote}>
                    <NotebookPen size={15} aria-hidden="true" />
                    Add note
                  </button>
                </div>
                {selected.notes.length > 0 ? (
                  <ul className="case-notes">
                    {selected.notes.map((note) => (
                      <li key={note.id}>
                        <span>{formatTimeAgo(note.createdAt)}</span>
                        <p>{note.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </article>
          ) : (
            <div className="case-detail case-detail-empty">
              <FolderKanban size={28} aria-hidden="true" />
              <p>Select a case to see its addresses, notes, and export options.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
