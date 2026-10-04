import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { mantineTheme } from '@/@pango.core/theme/mantineTheme'
import { routes } from '@/app/routes'
import { makeStore } from '@/app/store/store'

/**
 * Renders the real route table at `path`, in a fresh store and the Mantine theme in test mode
 * (no portals or transitions, so tooltips and dropdowns render in place). Pair with
 * `serveBuilds()` from `@tests/mocks/api`, which answers the pages' requests.
 */
export function renderRoute(path: string) {
  const store = makeStore()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return {
    store,
    router,
    user: userEvent.setup(),
    // jsdom loads no CSS, so Mantine's variables and global classes only slow down queries.
    ...render(
      <Provider store={store}>
        <MantineProvider
          theme={mantineTheme}
          env="test"
          withCssVariables={false}
          withGlobalClasses={false}
        >
          <RouterProvider router={router} />
        </MantineProvider>
      </Provider>
    ),
  }
}
