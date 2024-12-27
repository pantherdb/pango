import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './app/layout/Layout';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import theme from './@pango.core/theme/theme';
import Home from './app/home/Home';
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <Home /> },
      // { path: 'gene/:id', element: <Gene /> }
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
