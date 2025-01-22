import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './app/layout/Layout';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import theme from './@pango.core/theme/theme';
import Home from './app/home/Home';

import { defineCustomElements } from 'panther-overrep-form/loader';
import LeftDrawerContent from './app/home/LeftDrawer';
import Gene from './app/genes/Gene';
defineCustomElements(window);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout
      leftDrawerContent={<LeftDrawerContent />}
    />,
    children: [
      { path: '', element: <Home /> },
      // Other routes without drawers
      //{ path: 'gene/:id', element: <Gene /> }
    ],
  },

  {
    path: 'gene/:id',
    element: <Layout
      rightDrawerContent={<LeftDrawerContent />}
    />,
    children: [
      { path: '', element: <Gene /> },
    ],
  },
]);

const App: React.FC = () => {
  return <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
};

export default App;
