import '@testing-library/jest-dom/vitest'

HTMLCanvasElement.prototype.getContext = () =>
  ({
    clearRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
  }) as unknown as CanvasRenderingContext2D