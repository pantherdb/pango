import '@testing-library/jest-dom/vitest'

// jsdom polyfills Mantine needs. They are plain functions on purpose: vite.config.ts sets
// `mockReset: true`, which resets every vi.fn() before each test and would leave a vi.fn()
// stub returning undefined.

// Mantine's color-scheme manager and useMediaQuery (see useIsMobile) call matchMedia.
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

// floating-ui (Tooltip, Popover, Menu, Combobox) observes the size of its anchors.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    // The stub only needs the instance methods; the cast satisfies the constructor type.
  } as unknown as typeof ResizeObserver
}

// Combobox scrolls the active option into view.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom's scrollTo only logs "not implemented"; the gene pager scrolls to the top on page change.
window.scrollTo = () => {}
