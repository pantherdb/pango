import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './app/layout/Layout'
import { ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import theme from './@pango.core/theme/theme'

import { defineCustomElements } from 'panther-overrep-form/loader'
import Gene from './app/Gene'
import LeftDrawerContent from './app/layout/LeftDrawer'
import RightDrawerContent from './app/layout/RightDrawer'
import Home from './app/Home'
import About from './app/About'
defineCustomElements(window)

const router = createBrowserRouter([
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
])

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
