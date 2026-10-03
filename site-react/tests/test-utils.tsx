import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import type { AppStore, RootState } from '@/app/store/store'
import { makeStore } from '@/app/store/store'
import { mantineTheme } from '@/@pango.core/theme/mantineTheme'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  /** Initial Redux state; build slices with the helpers in `@tests/fixtures/state`. */
  preloadedState?: Partial<RootState>
  /** Use an existing store instead of creating one from `preloadedState`. */
  store?: AppStore
  /** Initial router location. */
  route?: string
  /**
   * `test` (default) renders Mantine overlays inline and without transitions, so menus and
   * dropdowns are in the DOM synchronously. Use `default` to exercise real portals.
   */
  mantineEnv?: 'default' | 'test'
}

/**
 * Renders `ui` inside the app's providers (Redux store, Mantine theme, router) and returns the
 * store and a `user-event` instance alongside Testing Library's queries.
 */
export const renderWithProviders = (
  ui: ReactElement,
  extendedRenderOptions: ExtendedRenderOptions = {}
) => {
  const {
    preloadedState = {},
    store = makeStore(preloadedState),
    route = '/',
    mantineEnv = 'test',
    ...renderOptions
  } = extendedRenderOptions

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <MantineProvider theme={mantineTheme} env={mantineEnv}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </MantineProvider>
    </Provider>
  )

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
