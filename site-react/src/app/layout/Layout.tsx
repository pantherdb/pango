import type React from 'react';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import type { AppBarProps as MuiAppBarProps } from '@mui/material';
import {
  Box,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  AppBar as MuiAppBar,
  Toolbar
} from '@mui/material';
import { MdClose, MdMenu } from 'react-icons/md';
import { Link, Outlet } from 'react-router-dom';

const drawerWidth = 380;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

interface LayoutProps {
  leftDrawerContent?: React.ReactNode;
  rightDrawerContent?: React.ReactNode;
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'rightOpen'
})<{ open?: boolean; rightOpen?: boolean }>(({ theme, open, rightOpen }) => ({
  flexGrow: 1,
  padding: 0,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    marginLeft: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(rightOpen && {
    marginRight: '500px',
  }),
}));

const Layout: React.FC<LayoutProps> = ({ leftDrawerContent, rightDrawerContent }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" open={leftDrawerOpen}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            edge="start"
            sx={{ mr: 2, ...(leftDrawerOpen && { display: 'none' }) }}
          >
            <MdMenu />
          </IconButton>
          <Link to="/" className="no-underline hover:text-gray-600 text-2xl md:text-3xl">
            <strong>PAN-GO:</strong> Human Functionome
          </Link>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={leftDrawerOpen}
      >
        <DrawerHeader>
          <IconButton onClick={() => setLeftDrawerOpen(false)}>
            <MdClose />
          </IconButton>
        </DrawerHeader>
        {leftDrawerContent}
      </Drawer>

      <Main open={leftDrawerOpen} rightOpen={rightDrawerOpen}>
        <DrawerHeader />
        <Outlet />
      </Main>

      {rightDrawerContent && (
        <Drawer
          anchor="right"
          open={rightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
          sx={{
            width: 500,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 500,
            },
          }}
        >
          <DrawerHeader>
            <IconButton onClick={() => setRightDrawerOpen(false)}>
              <MdClose />
            </IconButton>
          </DrawerHeader>
          {rightDrawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Layout;