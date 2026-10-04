import '@testing-library/jest-dom/vitest'

// jsdom polyfills Mantine needs; specs that run in the node environment (`// @vitest-environment
// node`: the server and some model specs) have no window and skip them. They are plain functions
// on purpose: vite.config.ts sets `mockReset: true`, which resets every vi.fn() before each test
// and would leave a vi.fn() stub returning undefined.

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }

  // floating-ui (Tooltip, Select) observes the size of its anchors.
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}
