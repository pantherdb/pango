import type { RouteObject } from 'react-router-dom'
import AppLayout from '@/app/layout/AppLayout'
import BuildPage from '@/features/builds/pages/BuildPage'
import BuildsPage from '@/features/builds/pages/BuildsPage'
import DatasetPage from '@/features/builds/pages/DatasetPage'
import EnvironmentsPage from '@/features/builds/pages/EnvironmentsPage'
import NotFoundPage from '@/features/builds/pages/NotFoundPage'
import RunPage from '@/features/builds/pages/RunPage'

/** The route table; App.tsx mounts it in a browser router, tests in a memory router. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <BuildsPage /> },
      { path: 'builds/:buildId', element: <BuildPage /> },
      { path: 'builds/:buildId/datasets/:dataset', element: <DatasetPage /> },
      { path: 'builds/:buildId/runs/:runId', element: <RunPage /> },
      { path: 'live', element: <EnvironmentsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
