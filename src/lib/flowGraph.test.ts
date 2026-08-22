import { describe, expect, it } from 'vitest'
import {
  buildFlowGraph,
  expandNode,
  layoutGraph,
  MAX_GRAPH_NODES,
  peersOf,
  shortestPath,
} from './flowGraph'

const ROOT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

describe('flow graph', () => {
  it('is fully deterministic for the same address and chain', () => {
    const first = buildFlowGraph(ROOT, 'ethereum', { depth: 2 })
    const second = buildFlowGraph(ROOT, 'ethereum', { depth: 2 })
    expect(second).toEqual(first)
  })

  it('differs across chains', () => {
    const eth = buildFlowGraph(ROOT, 'ethereum', { depth: 1 })
    const sol = buildFlowGraph(ROOT, 'solana', { depth: 1 })
    expect(eth.nodes.map((n) => n.id)).not.toEqual(sol.nodes.map((n) => n.id))
  })

  it('produces well-formed nodes and edges', () => {
    const graph = buildFlowGraph(ROOT, 'base', { depth: 2 })
    const ids = new Set(graph.nodes.map((node) => node.id))

    expect(ids.has(graph.root)).toBe(true)
    expect(graph.nodes.length).toBeGreaterThan(3)
    for (const edge of graph.edges) {
      expect(ids.has(edge.source)).toBe(true)
      expect(ids.has(edge.target)).toBe(true)
      expect(edge.totalUsd).toBeGreaterThan(0)
    }
    for (const node of graph.nodes) {
      expect(node.riskScore).toBeGreaterThanOrEqual(5)
      expect(node.riskScore).toBeLessThanOrEqual(95)
    }
  })

  it('caps the graph at maxNodes', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 6, breadth: 8 })
    expect(graph.nodes.length).toBeLessThanOrEqual(MAX_GRAPH_NODES)
  })

  it('expandNode merges new peers exactly once', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 1 })
    const leaf = graph.nodes.find((node) => node.depth === 1)!
    const expanded = expandNode(graph, leaf.address)
    expect(expanded.nodes.length).toBeGreaterThan(graph.nodes.length)

    const twice = expandNode(expanded, leaf.address)
    expect(twice.nodes.length).toBe(expanded.nodes.length)
    expect(twice.edges.length).toBe(expanded.edges.length)
  })

  it('expandNode ignores unknown addresses', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 1 })
    expect(expandNode(graph, '0xdeadbeef')).toBe(graph)
  })

  it('peersOf is stable and bounded', () => {
    const peers = peersOf(ROOT, 'ethereum', 5)
    expect(peersOf(ROOT, 'ethereum', 5)).toEqual(peers)
    expect(peers.length).toBeGreaterThanOrEqual(2)
    expect(peers.length).toBeLessThanOrEqual(6)
    for (const peer of peers) {
      expect(peer).toMatch(/^0x[0-9a-f]{40}$/)
    }
  })

  it('finds shortest paths from the root to every node', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 2 })
    for (const node of graph.nodes) {
      const path = shortestPath(graph, graph.root, node.id)
      expect(path).not.toBeNull()
      expect(path![0]).toBe(graph.root)
      expect(path![path!.length - 1]).toBe(node.id)
      expect(path!.length).toBeLessThanOrEqual(node.depth + 1)
    }
  })

  it('returns null for unreachable targets and a single-node path for self', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 1 })
    expect(shortestPath(graph, graph.root, '0x0000000000000000000000000000000000000000')).toBeNull()
    expect(shortestPath(graph, graph.root, graph.root)).toEqual([graph.root])
  })

  it('lays out every node inside the canvas, deterministically', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 2 })
    const layout = layoutGraph(graph, 900, 600)
    const again = layoutGraph(graph, 900, 600)

    expect(layout.size).toBe(graph.nodes.length)
    for (const node of graph.nodes) {
      const point = layout.get(node.id)!
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(900)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(600)
      expect(again.get(node.id)).toEqual(point)
    }
  })

  it('keeps the root pinned to the canvas center', () => {
    const graph = buildFlowGraph(ROOT, 'ethereum', { depth: 2 })
    const layout = layoutGraph(graph, 800, 500)
    expect(layout.get(graph.root)).toEqual({ x: 400, y: 250 })
  })
})
