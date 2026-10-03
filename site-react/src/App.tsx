import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import Layout from './app/layout/Layout'
import mantineTheme from './@pango.core/theme/mantineTheme'

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

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <MantineProvider theme={mantineTheme} defaultColorScheme="light">
        <Notifications position="top-right" />
        <RouterProvider router={router} />
      </MantineProvider>
    </React.StrictMode>
  )
}

export default App
