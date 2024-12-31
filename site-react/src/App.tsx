import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './app/layout/Layout';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import theme from './@pango.core/theme/theme';
import Home from './app/home/Home';
import CategoryStats from './app/genes/CategoryStats';
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout
      leftDrawerContent={<CategoryStats />}
    />,
    children: [
      { path: '', element: <Home /> },
      // Other routes without drawers
      //{ path: 'gene/:id', element: <Gene /> }
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
