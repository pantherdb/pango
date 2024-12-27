import type * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MdExplore, MdBookmark, MdHome, MdLogout } from "react-icons/md";
import type { NavItem } from './NavButton';
import NavButton from './NavButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Avatar, Menu, MenuItem, Button } from '@mui/material';

const drawerWidth = 80;
const MOBILE_BREAKPOINT = 'sm';

// Define proper interface for styled components props
interface MainProps {
  open?: boolean;
  ismobile: boolean;
}

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  ismobile: boolean;
}

// Custom BottomNavLink component
const BottomNavLink: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
}> = ({ icon: Icon, label, path, isActive }) => {
  return (
    <Link
      to={path}
      className={`flex flex-col items-center justify-center flex-1 py-2 px-1 
        ${isActive ? 'text-blue-600' : 'text-gray-600'}
        transition-colors duration-200 ease-in-out
        hover:text-blue-500 focus:outline-none`}
    >
      <Icon className={`text-4xl ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

const Main = styled('main', {
  shouldForwardProp: (prop) => !['open', 'ismobile'].includes(prop as string)
})<MainProps>(({ theme, open, ismobile }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(ismobile ? {
    paddingTop: "50px",
    paddingBottom: "64px",
    marginLeft: 0,
  } : {
    paddingTop: "50px",
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => !['open', 'ismobile'].includes(prop as string),
})<AppBarProps>(({ theme, open, ismobile }) => ({
  backgroundColor: "#FFFFFF",
  height: "50px",
  minHeight: "50px",
  borderBottom: `3px solid ${theme.palette.secondary.main}`,
  color: theme.palette.secondary.main,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(ismobile ? {
    width: '100%',
  } : {
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
}));

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down(MOBILE_BREAKPOINT));
  const [open, setOpen] = useState(!isMobile);
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navItems: NavItem[] = [
    { icon: MdHome, label: 'Discover', path: '/' },
    { icon: MdExplore, label: 'Explore', path: '/explore' },
    { icon: MdBookmark, label: 'Bookmarks', path: '/bookmarks' },
  ];

  const renderBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item, index) => (
          <BottomNavLink
            key={index}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={currentPath === item.path}
          />
        ))}
      </div>
    </nav>
  );

  return (
    <Box className="flex w-full">
      <CssBaseline />
      <AppBar position="fixed" open={open} ismobile={isMobile}>
        <Toolbar className="!min-h-[50px]">
          <div className="flex-grow">
            <Link
              to="/"
              className={`no-underline hover:text-gray-600 ${isMobile ? 'text-2xl' : 'text-3xl'}`}            >
              <strong>PAN-GO:</strong> Human Functionome
            </Link>
          </div>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <div className="mt-16 w-full bg-white shadow-sm rounded-lg p-2">
            <div className="space-y-1 w-full max-w-2xl bg-white shadow-lg rounded-xl p-4">
              <div className="flex flex-col">
                {navItems.map((item, index) => (
                  <NavButton
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                  />
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      <Main open={open} ismobile={isMobile} className="w-full flex justify-center">
        <Box className={`w-full ${isMobile ? 'p-0' : ''}`}>
          <Outlet />
        </Box>
      </Main>

      {isMobile && renderBottomNav()}
    </Box>
  );
};
export default Layout;