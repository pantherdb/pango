import { vi } from 'vitest'

/**
 * A settled RTK Query hook result, for `vi.mocked(useSomethingQuery).mockReturnValue(...)`.
 * Typed as `never` so one helper fits every generated hook's (very wide) result type.
 */
export const queryResult = <T>(data: T, overrides: Record<string, unknown> = {}) =>
  ({
    data,
    currentData: data,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    error: undefined,
    refetch: () => {},
    ...overrides,
  }) as never

/** Makes every `matchMedia` query report `matches`. Undo with `vi.restoreAllMocks()`. */
export const mockMatchMedia = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
