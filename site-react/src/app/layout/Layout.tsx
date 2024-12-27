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

const Layout: React.FC = () => {
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

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={leftDrawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: '1px solid #111',
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <DrawerHeader>
          <span className="text-lg font-medium">Filter Options</span>
          <div className="space-x-2">
            <Button
              variant="outlined"
              color="error"
              size="small"
              className="rounded-full text-xs"
            >
              Clear All Filters
            </Button>
            <IconButton size="small" onClick={handleDrawerToggle}>
              <MdClose />
            </IconButton>
          </div>
        </DrawerHeader>
        <Box className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Drawer content components will go here */}
          </div>
        </Box>
      </Drawer>

      <Main open={leftDrawerOpen} rightOpen={rightDrawerOpen}>
        <Toolbar /> {/* Spacer for AppBar */}
        <Box className="p-4">
          <Outlet />
        </Box>
      </Main>

      <Drawer
        anchor="right"
        open={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 500,
          },
        }}
      >
        <DrawerHeader>
          <span className="text-lg font-medium">Details</span>
          <IconButton onClick={() => setRightDrawerOpen(false)}>
            <MdClose />
          </IconButton>
        </DrawerHeader>
      </Drawer>
    </Box>
  );
};

export default Layout;