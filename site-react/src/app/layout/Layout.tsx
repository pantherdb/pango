import type React from 'react';
import { Box, Drawer } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Toolbar from './Toolbar';
import Footer from './Footer';
import { selectLeftDrawerOpen, selectRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import { useAppSelector } from '../hooks';

interface LayoutProps {
  leftDrawerContent?: React.ReactNode;
  rightDrawerContent?: React.ReactNode;
}

const drawerWidth = 380;

const Layout: React.FC<LayoutProps> = ({ leftDrawerContent, rightDrawerContent }) => {

  const leftDrawerOpen = useAppSelector(selectLeftDrawerOpen);
  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen);

  return (
    <Box className="flex flex-col h-screen w-full bg-gray-300">
      <Toolbar
        showLoadingBar={false}
      />

      <Box className="flex flex-1 w-full fixed" style={{ top: 50, bottom: 0 }}>
        <Box
          sx={{
            width: leftDrawerOpen ? drawerWidth : 0,
            height: '100%',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: 'hidden'
          }}
        >
          {leftDrawerContent && (
            <Drawer
              variant="persistent"
              anchor="left"
              open={leftDrawerOpen}
              sx={{
                height: '100%',
                '& .MuiDrawer-paper': {
                  position: 'static',
                  width: drawerWidth,
                  height: '100%',
                  overflow: 'auto'
                },
              }}
            >

              {leftDrawerContent}
            </Drawer>
          )}
        </Box>

        <div className="flex-1 overflow-auto">
          <Outlet />
          <Footer />
        </div>

        <Box
          sx={{
            width: rightDrawerOpen ? 500 : 0,
            height: '100%',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: 'hidden'
          }}
        >
          {rightDrawerContent && (
            <Drawer
              variant="persistent"
              anchor="right"
              open={rightDrawerOpen}
              sx={{
                height: '100%',
                '& .MuiDrawer-paper': {
                  position: 'static',
                  width: 500,
                  height: '100%',
                  overflow: 'auto'
                },
              }}
            >
              {rightDrawerContent}
            </Drawer>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;