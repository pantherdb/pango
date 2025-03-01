import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './app/layout/Layout'
import { ThemeProvider } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './@pango.core/theme/theme'

import { defineCustomElements } from 'panther-overrep-form/loader'
import Gene from './app/Gene'
import LeftDrawerContent from './app/layout/LeftDrawer'
import RightDrawerContent from './app/layout/RightDrawer'
import Home from './app/Home'
import About from './app/About'
import Help from './app/Help'
defineCustomElements(window)

const routes = [
  {
    path: '/',
    element: <Layout leftDrawerContent={<LeftDrawerContent />} />,
    children: [{ path: '', element: <Home /> }],
  },
  {
    path: 'gene/:id',
    element: <Layout rightDrawerContent={<RightDrawerContent />} />,
    children: [{ path: '', element: <Gene /> }],
  },
  {
    path: 'about',
    element: <Layout />,
    children: [{ path: '', element: <About /> }],
  },
  {
    path: 'help',
    element: <Layout />,
    children: [{ path: '', element: <Help /> }],
  },
]

const router = createBrowserRouter(routes, {
  future: {
    // v7_startTransition: true,
    // v7_relativeSplatPath: true,
    // v7_fetcherPersist: true,
    // v7_normalizeFormMethod: true,
    // v7_partialHydration: true,
    // v7_skipActionErrorRevalidation: true,
  },
})

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>
  )
}

export default App
