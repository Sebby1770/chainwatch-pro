import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {
    return undefined
  }
  unobserve() {
    return undefined
  }
  disconnect() {
    return undefined
  }
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = ((_contextId: string) => ({
  clearRect: () => undefined,
  beginPath: () => undefined,
  arc: () => undefined,
  fill: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
})) as any