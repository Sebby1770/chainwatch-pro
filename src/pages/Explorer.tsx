import clsx from 'clsx'
import { FolderPlus, GitBranch, Route as RouteIcon, Search, Waypoints, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SectionTitle } from '../components/SectionTitle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { addAddressToCase, sortCases, type InvestigationCase } from '../lib/cases'
import { chains } from '../lib/constants'
import {
  buildFlowGraph,
  expandNode,
  layoutGraph,
  shortAddress,
  shortestPath,
  type FlowGraph,
  type FlowNode,
} from '../lib/flowGraph'
import { screenAddress } from '../lib/sanctions'
import type { ChainId } from '../lib/types'
import { formatCurrency, riskTone, scoreLabel } from '../lib/utils'

const CANVAS_W = 900
const CANVAS_H = 600
const DEFAULT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const NO_CASES: InvestigationCase[] = []

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

const HOME_VIEW: ViewBox = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H }

function nodeRadius(node: FlowNode): number {
  return 9 + Math.min(9, Math.log2(1 + node.txCount))
}

function edgeWidth(totalUsd: number): number {
  return 1 + Math.min(4.5, Math.log10(1 + totalUsd) / 1.6)
}

export function Explorer() {
  const [searchParams] = useSearchParams()
  const initialAddress = searchParams.get('address') ?? DEFAULT_ADDRESS
  const initialChain = (searchParams.get('chain') as ChainId | null) ?? 'ethereum'

  const [addressInput, setAddressInput] = useState(initialAddress)
  const [chain, setChain] = useState<ChainId>(initialChain)
  const [graph, setGraph] = useState<FlowGraph>(() => buildFlowGraph(initialAddress, initialChain))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tracing, setTracing] = useState(false)
  const [view, setView] = useState<ViewBox>(HOME_VIEW)
  const [cases, setCases] = useLocalStorage<InvestigationCase[]>('chainwatch-cases', NO_CASES)
  const [targetCaseId, setTargetCaseId] = useState('')
  const dragState = useRef<{ startX: number; startY: number; view: ViewBox } | null>(null)

  const layout = useMemo(() => layoutGraph(graph, CANVAS_W, CANVAS_H), [graph])
  const selected = useMemo(() => graph.nodes.find((node) => node.id === selectedId) ?? null, [graph, selectedId])
  const tracePath = useMemo(() => {
    if (!tracing || !selected) return null
    return shortestPath(graph, graph.root, selected.id)
  }, [graph, selected, tracing])
  const traceSet = useMemo(() => new Set(tracePath ?? []), [tracePath])
  const traceEdges = useMemo(() => {
    if (!tracePath) return new Set<string>()
    const pairs = new Set<string>()
    for (let i = 1; i < tracePath.length; i++) {
      pairs.add(`${tracePath[i - 1]}|${tracePath[i]}`)
      pairs.add(`${tracePath[i]}|${tracePath[i - 1]}`)
    }
    return pairs
  }, [tracePath])

  const openCases = useMemo(
    () => sortCases(cases).filter((item) => item.status === 'open' || item.status === 'investigating'),
    [cases],
  )

  const explore = () => {
    const trimmed = addressInput.trim()
    if (!trimmed) {
      toast.error('Enter an address to explore')
      return
    }
    setGraph(buildFlowGraph(trimmed, chain))
    setSelectedId(null)
    setTracing(false)
    setView(HOME_VIEW)
    toast.success('Flow graph rebuilt')
  }

  const expandSelected = () => {
    if (!selected) return
    const next = expandNode(graph, selected.address)
    if (next.nodes.length === graph.nodes.length) {
      toast.info('No new counterparties for this node')
      return
    }
    setGraph(next)
    toast.success(`Expanded ${shortAddress(selected.address)}`)
  }

  const addSelectedToCase = () => {
    if (!selected) return
    if (!targetCaseId) {
      toast.error('Pick a case first — create one on the Cases page')
      return
    }
    setCases((current) =>
      current.map((item) => (item.id === targetCaseId ? addAddressToCase(item, selected.address, chain) : item)),
    )
    const target = cases.find((item) => item.id === targetCaseId)
    toast.success(`Added ${shortAddress(selected.address)} to “${target?.title ?? 'case'}”`)
  }

  const zoom = useCallback((factor: number) => {
    setView((current) => {
      const w = Math.min(CANVAS_W * 2, Math.max(CANVAS_W / 6, current.w * factor))
      const h = (w / CANVAS_W) * CANVAS_H
      return {
        x: current.x + (current.w - w) / 2,
        y: current.y + (current.h - h) / 2,
        w,
        h,
      }
    })
  }, [])

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    dragState.current = { startX: event.clientX, startY: event.clientY, view }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current
    if (!drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    const scale = drag.view.w / rect.width
    setView({
      ...drag.view,
      x: drag.view.x - (event.clientX - drag.startX) * scale,
      y: drag.view.y - (event.clientY - drag.startY) * scale,
    })
  }

  const onPointerUp = () => {
    dragState.current = null
  }

  const screen = selected ? screenAddress(selected.address) : null

  return (
    <div className="page explorer-page">
      <section className="panel">
        <SectionTitle icon={Waypoints} eyebrow="Explorer" title="Address flow explorer" />
        <p className="panel-sub">
          Deterministic transaction-flow graph around any address. Click a node to inspect it, expand its
          counterparties, trace its route back to the root, or attach it to an investigation case.
        </p>

        <div className="explorer-toolbar">
          <div className="explorer-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && explore()}
              spellCheck="false"
              aria-label="Root address"
              placeholder="0x…"
            />
          </div>
          <select value={chain} onChange={(event) => setChain(event.target.value as ChainId)} aria-label="Chain">
            {chains.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="button" className="primary-button" onClick={explore}>
            <GitBranch size={16} aria-hidden="true" />
            Explore
          </button>
          <div className="explorer-zoom">
            <button type="button" className="icon-button" onClick={() => zoom(1 / 1.3)} aria-label="Zoom in" title="Zoom in">
              <ZoomIn size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={() => zoom(1.3)} aria-label="Zoom out" title="Zoom out">
              <ZoomOut size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={() => setView(HOME_VIEW)} aria-label="Reset view" title="Reset view">
              ⤾
            </button>
          </div>
        </div>

        <div className="explorer-body">
          <svg
            className="explorer-canvas"
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            role="img"
            aria-label="Transaction flow graph"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="explorer-arrow" />
              </marker>
            </defs>

            {graph.edges.map((edge) => {
              const from = layout.get(edge.source)
              const to = layout.get(edge.target)
              if (!from || !to) return null
              const onPath = traceEdges.has(`${edge.source}|${edge.target}`)
              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  strokeWidth={onPath ? edgeWidth(edge.totalUsd) + 1.5 : edgeWidth(edge.totalUsd)}
                  className={clsx('explorer-edge', edge.kind, { 'on-path': onPath, dimmed: tracePath !== null && !onPath })}
                  markerEnd="url(#flow-arrow)"
                />
              )
            })}

            {graph.nodes.map((node) => {
              const point = layout.get(node.id)
              if (!point) return null
              const tone = riskTone(node.riskScore)
              const isRoot = node.id === graph.root
              const isSelected = node.id === selectedId
              const onPath = traceSet.has(node.id)
              return (
                <g
                  key={node.id}
                  transform={`translate(${point.x}, ${point.y})`}
                  className={clsx('explorer-node', tone, {
                    root: isRoot,
                    selected: isSelected,
                    'on-path': onPath,
                    dimmed: tracePath !== null && !onPath,
                  })}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => {
                    setSelectedId(node.id)
                    const next = expandNode(graph, node.address)
                    if (next.nodes.length > graph.nodes.length) setGraph(next)
                  }}
                  role="button"
                  aria-label={`Address ${shortAddress(node.address)}, risk ${node.riskScore}`}
                >
                  {isRoot ? <circle className="explorer-root-ring" r={nodeRadius(node) + 5} /> : null}
                  <circle r={nodeRadius(node)} />
                  {node.sanction === 'hit' ? <text className="explorer-flag" y={-nodeRadius(node) - 6}>⚠</text> : null}
                  <text className="explorer-label" y={nodeRadius(node) + 13}>
                    {shortAddress(node.address)}
                  </text>
                </g>
              )
            })}
          </svg>

          <aside className="explorer-side">
            {selected && screen ? (
              <>
                <header>
                  <span className={clsx('status-pill', riskTone(selected.riskScore))}>
                    {scoreLabel(selected.riskScore)} · {selected.riskScore}
                  </span>
                  <code title={selected.address}>{shortAddress(selected.address)}</code>
                </header>

                <dl className="explorer-facts">
                  <div>
                    <dt>Inflow</dt>
                    <dd>{formatCurrency(selected.totalInUsd)}</dd>
                  </div>
                  <div>
                    <dt>Outflow</dt>
                    <dd>{formatCurrency(selected.totalOutUsd)}</dd>
                  </div>
                  <div>
                    <dt>Transactions</dt>
                    <dd>{selected.txCount}</dd>
                  </div>
                  <div>
                    <dt>Hops from root</dt>
                    <dd>{selected.depth}</dd>
                  </div>
                  <div>
                    <dt>Sanctions</dt>
                    <dd className={clsx('sanction', screen.status)}>
                      {screen.status === 'clear' ? 'Clear' : `${screen.status.toUpperCase()} · ${screen.lists.join(', ')}`}
                    </dd>
                  </div>
                </dl>

                <div className="explorer-actions">
                  <button type="button" className="secondary-button" onClick={expandSelected}>
                    <GitBranch size={15} aria-hidden="true" />
                    Expand peers
                  </button>
                  <button
                    type="button"
                    className={clsx('secondary-button', { active: tracing })}
                    onClick={() => setTracing((value) => !value)}
                    disabled={selected.id === graph.root}
                  >
                    <RouteIcon size={15} aria-hidden="true" />
                    {tracing ? 'Clear trace' : 'Trace from root'}
                  </button>
                </div>

                {tracePath ? (
                  <p className="explorer-trace-summary">
                    {tracePath.length - 1} hop{tracePath.length === 2 ? '' : 's'} from root:{' '}
                    {tracePath.map(shortAddress).join(' → ')}
                  </p>
                ) : null}

                <div className="explorer-case-row">
                  <select
                    value={targetCaseId}
                    onChange={(event) => setTargetCaseId(event.target.value)}
                    aria-label="Target case"
                  >
                    <option value="">Select a case…</option>
                    {openCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="secondary-button" onClick={addSelectedToCase}>
                    <FolderPlus size={15} aria-hidden="true" />
                    Add to case
                  </button>
                </div>
              </>
            ) : (
              <div className="explorer-empty">
                <Waypoints size={28} aria-hidden="true" />
                <p>
                  Click any node to inspect it. Double-click to expand its counterparties. Drag to pan, use the
                  zoom controls to get closer.
                </p>
                <p className="explorer-legend">
                  <span className="legend-dot healthy" /> healthy · <span className="legend-dot watch" /> monitor ·{' '}
                  <span className="legend-dot critical" /> high risk · ⚠ sanctions hit
                </p>
              </div>
            )}
          </aside>
        </div>

        <footer className="explorer-footer">
          {graph.nodes.length} nodes · {graph.edges.length} edges · deterministic demo data — the same address
          always produces the same graph
        </footer>
      </section>
    </div>
  )
}
