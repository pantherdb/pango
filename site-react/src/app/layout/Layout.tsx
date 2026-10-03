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
import { Drawer } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

interface LayoutProps {
  leftDrawerContent?: React.ReactNode
  rightDrawerContent?: React.ReactNode
}

const drawerWidth = 420

const Layout: React.FC<LayoutProps> = ({ leftDrawerContent, rightDrawerContent }) => {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 599.99px)')
  const dispatch = useAppDispatch()

  const leftDrawerOpen = useAppSelector(selectLeftDrawerOpen)
  const rightDrawerOpen = useAppSelector(selectRightDrawerOpen)

  const handleRightDrawerClose = () => {
    dispatch(setRightDrawerOpen(false))
  }

  useEffect(() => {
    initGA('G-245RCHN2PQ')
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  const leftWidth = leftDrawerOpen ? (isMobile ? '100%' : `${drawerWidth}px`) : '0'

  return (
    <div className="flex h-screen w-full flex-col bg-gray-300">
      <div className="fixed left-0 top-0 z-50 w-full">
        <Toolbar showLoadingBar={false} />
      </div>
      <div className="fixed left-0 top-12 z-50 w-full">
        <VersionBanner />
      </div>

      <div className="fixed flex w-full flex-1" style={{ top: 89, bottom: 0 }}>
        {leftDrawerContent && (
          <div
            className="h-full overflow-hidden border-r border-gray-300 bg-white transition-[width] duration-225 ease-out"
            style={{ width: leftWidth }}
          >
            <div className="h-full overflow-auto" style={{ width: isMobile ? '100%' : drawerWidth }}>
              {leftDrawerContent}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <Outlet />
          <Footer />
        </div>

        {rightDrawerContent && (
          <Drawer
            opened={rightDrawerOpen}
            onClose={handleRightDrawerClose}
            position="right"
            size={isMobile ? '100%' : 500}
            withCloseButton={false}
            keepMounted
          >
            {rightDrawerContent}
          </Drawer>
        )}
      </div>
    </div>
  )
}

export default Layout
