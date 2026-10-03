import type React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import Layout from './app/layout/Layout'
import { mantineTheme } from './@pango.core/theme/mantineTheme'

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
