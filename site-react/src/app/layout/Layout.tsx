import type React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Toolbar from './Toolbar'
import Footer from './Footer'
import VersionBanner from './VersionBanner'
import {
  selectLeftDrawerOpen,
  selectRightDrawerOpen,
  setRightDrawerOpen,
} from '@/@pango.core/components/drawer/drawerSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { initGA, trackPageView } from '@/analytics'
import { useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import useTheme from '@mui/material/styles/useTheme'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'

interface LayoutProps {
  leftDrawerContent?: React.ReactNode
  rightDrawerContent?: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ leftDrawerContent, rightDrawerContent }) => {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const dispatch = useAppDispatch()

  const leftDrawerOpen = useAppSelector(selectLeftDrawerOpen)
  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen)

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'left-panel',
    storage: localStorage,
  })

  const handleRightDrawerClose = () => {
    dispatch(setRightDrawerOpen(false))
  }

  useEffect(() => {
    initGA('G-245RCHN2PQ')
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return (
    <Box className="flex h-screen w-full flex-col bg-gray-300">
      <div className="fixed left-0 top-0 z-50 w-full">
        <Toolbar showLoadingBar={false} />
      </div>
      <div className="fixed left-0 top-12 z-50 w-full">
        <VersionBanner />
      </div>

      <Box className="fixed flex w-full flex-1" style={{ top: 89, bottom: 0 }}>
        {leftDrawerContent && !isMobile && leftDrawerOpen ? (
          <Group orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
            <Panel id="left" defaultSize="25%" minSize="15%" maxSize="45%">
              <div className="h-full overflow-auto bg-white">{leftDrawerContent}</div>
            </Panel>
            <Separator className="group flex w-1.5 items-center justify-center bg-gray-300 transition-colors hover:bg-blue-300">
              <div className="h-8 w-0.5 rounded-full bg-gray-400 transition-colors group-hover:bg-blue-600" />
            </Separator>
            <Panel id="main">
              <div className="h-full overflow-auto">
                <Outlet />
                <Footer />
              </div>
            </Panel>
          </Group>
        ) : (
          <>
            {leftDrawerContent && isMobile && (
              <Box
                sx={{
                  width: leftDrawerOpen ? '100%' : 0,
                  height: '100%',
                  transition: theme =>
                    theme.transitions.create('width', {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                  overflow: 'hidden',
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
                      width: '100%',
                      height: '100%',
                      overflow: 'auto',
                    },
                  }}
                >
                  {leftDrawerContent}
                </Drawer>
              </Box>
            )}
            <div className="flex-1 overflow-auto">
              <Outlet />
              <Footer />
            </div>
          </>
        )}

        {rightDrawerContent && (
          <Drawer
            variant="temporary"
            anchor="right"
            open={rightDrawerOpen}
            onClose={handleRightDrawerClose}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: isMobile ? '100%' : 500,
                height: '100%',
                overflow: 'auto',
                transition: theme =>
                  theme.transitions.create('transform', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
              },
            }}
          >
            {rightDrawerContent}
          </Drawer>
        )}
      </Box>
    </Box>
  )
}

export default Layout
