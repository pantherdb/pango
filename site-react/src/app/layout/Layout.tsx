import type React from 'react';
import { useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import PangoToolbar from './Toolbar';

interface LayoutProps {
  leftDrawerContent?: React.ReactNode;
  rightDrawerContent?: React.ReactNode;
}

const drawerWidth = 380;

const Layout: React.FC<LayoutProps> = ({ leftDrawerContent, rightDrawerContent }) => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  return (
    <Box className="flex flex-col h-screen w-full">
      <PangoToolbar
        openLeftDrawer={() => setLeftDrawerOpen(true)}
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
            <Box className="flex justify-end p-1">
              <IconButton onClick={() => setLeftDrawerOpen(false)}>
                <MdClose />
              </IconButton>
            </Box>
            {leftDrawerContent}
          </Drawer>
        </Box>

        <Box className="flex-1 overflow-auto">
          <Outlet />
        </Box>

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
              <Box className="flex justify-end p-1">
                <IconButton onClick={() => setRightDrawerOpen(false)}>
                  <MdClose />
                </IconButton>
              </Box>
              {rightDrawerContent}
            </Drawer>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;