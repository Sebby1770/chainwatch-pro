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

HTMLCanvasElement.prototype.getContext = (() => ({
  clearRect: () => undefined,
  beginPath: () => undefined,
  arc: () => undefined,
  fill: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
})) as unknown as typeof HTMLCanvasElement.prototype.getContext
