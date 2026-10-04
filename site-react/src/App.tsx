import type React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { defineCustomElements } from 'panther-overrep-form/loader'
import { mantineTheme } from './@pango.core/theme/mantineTheme'
import { routes } from './app/routes'

defineCustomElements(window)

const router = createBrowserRouter(routes)

// StrictMode is applied once, in main.tsx.
const App: React.FC = () => {
  return (
    <MantineProvider theme={mantineTheme}>
      <RouterProvider router={router} />
    </MantineProvider>
  )
}

export default App
