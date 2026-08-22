import { screenAddress, type SanctionStatus } from './sanctions'
import type { ChainId } from './types'
import { clamp, hashText } from './utils'

export type FlowEdgeKind = 'transfer' | 'swap' | 'bridge' | 'contract'

export interface FlowNode {
  id: string
  address: string
  depth: number
  riskScore: number
  sanction: SanctionStatus
  totalInUsd: number
  totalOutUsd: number
  txCount: number
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  txCount: number
  totalUsd: number
  kind: FlowEdgeKind
}

export interface FlowGraph {
  root: string
  chain: ChainId
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface LayoutPoint {
  x: number
  y: number
}

const EDGE_KINDS: FlowEdgeKind[] = ['transfer', 'swap', 'bridge', 'contract']
export const MAX_GRAPH_NODES = 60

function syntheticAddress(seed: number): string {
  const head = ((seed * 2654435761) >>> 0).toString(16).padStart(8, '0')
  const mid = ((seed * 40503 + 9973) >>> 0).toString(16).padStart(8, '0')
  const tail = ((seed * 104729 + 7919) >>> 0).toString(16).padStart(8, '0')
  return `0x${(head + mid + tail + head + mid).slice(0, 40)}`
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

function nodeRisk(address: string, chain: ChainId): { riskScore: number; sanction: SanctionStatus } {
  const sanction = screenAddress(address).status
  const seed = hashText(`${address.toLowerCase()}-${chain}-risk`)
  let riskScore = clamp(8 + (seed % 88), 5, 95)
  if (sanction === 'hit') riskScore = Math.max(riskScore, 90)
  else if (sanction === 'watch') riskScore = Math.max(riskScore, 55)
  return { riskScore, sanction }
}

export function makeFlowNode(address: string, chain: ChainId, depth: number): FlowNode {
  const seed = hashText(`${address.toLowerCase()}-${chain}-node`)
  const { riskScore, sanction } = nodeRisk(address, chain)
  return {
    id: address.toLowerCase(),
    address,
    depth,
    riskScore,
    sanction,
    totalInUsd: 1_000 + (seed % 840_000),
    totalOutUsd: 500 + ((seed >> 3) % 610_000),
    txCount: 4 + (seed % 240),
  }
}

/**
 * Deterministic counterparties for an address. The same address on the same
 * chain always produces the same peers, so exploration is reproducible.
 */
export function peersOf(address: string, chain: ChainId, breadth = 5): string[] {
  const base = hashText(`${address.toLowerCase()}-${chain}-peers`)
  const count = 2 + (base % Math.max(1, breadth))
  return Array.from({ length: count }, (_, index) => syntheticAddress(base * 31 + index * 7919 + 13))
}

function makeEdge(from: string, to: string, chain: ChainId): FlowEdge {
  const a = from.toLowerCase()
  const b = to.toLowerCase()
  const seed = hashText(`${a}->${b}-${chain}`)
  const outbound = seed % 2 === 0
  const source = outbound ? a : b
  const target = outbound ? b : a
  return {
    id: `${source}->${target}`,
    source,
    target,
    txCount: 1 + (seed % 40),
    totalUsd: 250 + (seed % 1_450_000),
    kind: EDGE_KINDS[seed % EDGE_KINDS.length],
  }
}

/** Breadth-first expansion from a root address, capped at maxNodes. */
export function buildFlowGraph(
  address: string,
  chain: ChainId,
  options: { depth?: number; breadth?: number; maxNodes?: number } = {},
): FlowGraph {
  const { depth = 2, breadth = 5, maxNodes = MAX_GRAPH_NODES } = options
  const rootId = address.toLowerCase()
  const nodes = new Map<string, FlowNode>()
  const edges = new Map<string, FlowEdge>()

  nodes.set(rootId, makeFlowNode(address, chain, 0))
  let frontier = [rootId]

  for (let level = 1; level <= depth; level++) {
    const nextFrontier: string[] = []
    for (const current of frontier) {
      for (const peer of peersOf(current, chain, breadth)) {
        const peerId = peer.toLowerCase()
        const edge = makeEdge(current, peerId, chain)
        if (!nodes.has(peerId)) {
          if (nodes.size >= maxNodes) continue
          nodes.set(peerId, makeFlowNode(peer, chain, level))
          nextFrontier.push(peerId)
        }
        if (!edges.has(edge.id)) edges.set(edge.id, edge)
      }
    }
    frontier = nextFrontier
  }

  return { root: rootId, chain, nodes: [...nodes.values()], edges: [...edges.values()] }
}

/** Merge one node's peers into an existing graph (interactive expansion). */
export function expandNode(graph: FlowGraph, address: string, options: { breadth?: number; maxNodes?: number } = {}): FlowGraph {
  const { breadth = 5, maxNodes = MAX_GRAPH_NODES } = options
  const targetId = address.toLowerCase()
  const existing = graph.nodes.find((node) => node.id === targetId)
  if (!existing) return graph

  const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]))

  for (const peer of peersOf(targetId, graph.chain, breadth)) {
    const peerId = peer.toLowerCase()
    const edge = makeEdge(targetId, peerId, graph.chain)
    if (!nodes.has(peerId)) {
      if (nodes.size >= maxNodes) continue
      nodes.set(peerId, makeFlowNode(peer, graph.chain, existing.depth + 1))
    }
    if (!edges.has(edge.id)) edges.set(edge.id, edge)
  }

  return { ...graph, nodes: [...nodes.values()], edges: [...edges.values()] }
}

/** Undirected BFS shortest path between two node ids; null when unreachable. */
export function shortestPath(graph: FlowGraph, fromId: string, toId: string): string[] | null {
  const from = fromId.toLowerCase()
  const to = toId.toLowerCase()
  if (from === to) return [from]

  const adjacency = new Map<string, string[]>()
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, [])
    adjacency.get(edge.source)!.push(edge.target)
    adjacency.get(edge.target)!.push(edge.source)
  }

  const previous = new Map<string, string>()
  const visited = new Set([from])
  let queue = [from]

  while (queue.length > 0) {
    const nextQueue: string[] = []
    for (const current of queue) {
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue
        visited.add(neighbor)
        previous.set(neighbor, current)
        if (neighbor === to) {
          const path = [to]
          let cursor = to
          while (cursor !== from) {
            cursor = previous.get(cursor)!
            path.unshift(cursor)
          }
          return path
        }
        nextQueue.push(neighbor)
      }
    }
    queue = nextQueue
  }

  return null
}

/**
 * Deterministic force-directed layout: seeded ring placement by depth, then a
 * fixed number of repulsion/spring/gravity iterations. No randomness, so the
 * same graph always lays out identically.
 */
export function layoutGraph(
  graph: FlowGraph,
  width: number,
  height: number,
  iterations = 150,
): Map<string, LayoutPoint> {
  const positions = new Map<string, { x: number; y: number }>()
  const centerX = width / 2
  const centerY = height / 2
  const ringGap = Math.min(width, height) / 7

  for (const node of graph.nodes) {
    if (node.id === graph.root) {
      positions.set(node.id, { x: centerX, y: centerY })
      continue
    }
    const angle = ((hashText(`${node.id}-angle`) % 3600) / 3600) * Math.PI * 2
    const radius = ringGap * node.depth + (hashText(`${node.id}-radius`) % Math.round(ringGap * 0.6))
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    })
  }

  const nodeIds = graph.nodes.map((node) => node.id)
  const repulsion = ringGap * ringGap * 1.6
  const springLength = ringGap * 1.15
  const padding = 30

  for (let step = 0; step < iterations; step++) {
    const cooling = 1 - step / iterations
    const forces = new Map<string, { x: number; y: number }>(nodeIds.map((id) => [id, { x: 0, y: 0 }]))

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a = positions.get(nodeIds[i])!
        const b = positions.get(nodeIds[j])!
        let dx = a.x - b.x
        let dy = a.y - b.y
        let distSq = dx * dx + dy * dy
        if (distSq < 1) {
          // deterministic nudge for coincident nodes
          dx = ((hashText(`${nodeIds[i]}-${nodeIds[j]}`) % 7) - 3) || 1
          dy = ((hashText(`${nodeIds[j]}-${nodeIds[i]}`) % 7) - 3) || 1
          distSq = dx * dx + dy * dy
        }
        const dist = Math.sqrt(distSq)
        const force = repulsion / distSq
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fa = forces.get(nodeIds[i])!
        const fb = forces.get(nodeIds[j])!
        fa.x += fx
        fa.y += fy
        fb.x -= fx
        fb.y -= fy
      }
    }

    for (const edge of graph.edges) {
      const a = positions.get(edge.source)
      const b = positions.get(edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const stretch = (dist - springLength) * 0.045
      const fx = (dx / dist) * stretch
      const fy = (dy / dist) * stretch
      const fa = forces.get(edge.source)!
      const fb = forces.get(edge.target)!
      fa.x += fx
      fa.y += fy
      fb.x -= fx
      fb.y -= fy
    }

    for (const id of nodeIds) {
      const position = positions.get(id)!
      const force = forces.get(id)!
      // gentle gravity toward the center keeps disconnected clusters on-canvas
      force.x += (centerX - position.x) * 0.012
      force.y += (centerY - position.y) * 0.012

      if (id === graph.root) continue
      const limit = ringGap * 0.4 * cooling
      position.x += clamp(force.x, -limit, limit)
      position.y += clamp(force.y, -limit, limit)
      position.x = clamp(position.x, padding, width - padding)
      position.y = clamp(position.y, padding, height - padding)
    }
  }

  return positions
}
