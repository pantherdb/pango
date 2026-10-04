import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { mantineTheme } from '@/@pango.core/theme/mantineTheme'
import { routes } from '@/app/routes'

const router = createBrowserRouter(routes)

// StrictMode is applied once, in main.tsx.
const App = () => (
  <MantineProvider theme={mantineTheme}>
    <RouterProvider router={router} />
  </MantineProvider>
)

export default App
