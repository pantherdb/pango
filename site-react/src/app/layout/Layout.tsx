import type React from 'react';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import type {
  AppBarProps as MuiAppBarProps
} from '@mui/material';
import {
  Box,
  Drawer,
  Button,
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



interface MainProps {
  open: boolean;
  rightOpen?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  backgroundColor: '#FFFFFF',
  height: '50px',
  minHeight: '50px',
  borderBottom: `3px solid ${theme.palette.secondary.main}`,
  color: theme.palette.secondary.main,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Main = styled('main')<MainProps>(({ theme, open, rightOpen }) => ({
  flexGrow: 1,
  marginLeft: 0,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: `${drawerWidth}px`,
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
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(!isMobile);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setLeftDrawerOpen(!leftDrawerOpen);
  };

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  }));

  return (
    <Box className="flex w-full min-h-screen">
      <AppBar position="fixed" open={leftDrawerOpen}>
        <Toolbar className="min-h-[50px]">
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            className={leftDrawerOpen ? 'hidden' : ''}
          >
            <MdMenu />
          </IconButton>
          <Link to="/" className="no-underline hover:text-gray-600 text-2xl md:text-3xl">
            <strong>PAN-GO:</strong> Human Functionome
          </Link>
        </Toolbar>
      </AppBar>

      {leftDrawerContent && (
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="left"
          open={leftDrawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              width: drawerWidth
            }
          }}>
          <DrawerHeader>
            <span>Filter Options</span>
            <IconButton onClick={handleDrawerToggle}>
              <MdClose />
            </IconButton>
          </DrawerHeader>
          <Box className="p-4">
            {leftDrawerContent}
          </Box>
        </Drawer>
      )}

      <Main open={leftDrawerOpen} rightOpen={rightDrawerOpen}>
        <Toolbar />
        <Box className="p-4">
          <Outlet />
        </Box>
      </Main>

      {rightDrawerContent && (
        <Drawer
          anchor="right"
          open={rightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: 500 } }}>
          <DrawerHeader>
            <span>Details</span>
            <IconButton onClick={() => setRightDrawerOpen(false)}>
              <MdClose />
            </IconButton>
          </DrawerHeader>
          <Box className="p-4">
            {rightDrawerContent}
          </Box>
        </Drawer>
      )}
    </Box>
  );
};


export default Layout;