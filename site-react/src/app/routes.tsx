import type { RouteObject } from 'react-router-dom'
import Layout from './layout/Layout'
import LeftDrawerContent from './layout/LeftDrawer'
import RightDrawerContent from './layout/RightDrawer'
import Home from './Home'
import Gene from './Gene'
import About from './About'
import Help from './Help'

/** The site's route table; App mounts it in a browser router, tests in a memory router. */
export const routes: RouteObject[] = [
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
