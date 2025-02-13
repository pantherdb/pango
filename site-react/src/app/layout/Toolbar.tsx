import type React from 'react'
import { useState } from 'react'
import { IconButton, Button, Menu, MenuItem, LinearProgress } from '@mui/material'
import { FaBars, FaGithub } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { toggleLeftDrawer } from '@/@pango.core/components/drawer/drawerSlice'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { ENVIRONMENT } from '@/@pango.core/data/constants'

interface ToolbarProps {
  showLoadingBar?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ showLoadingBar }) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)
  const dispatch = useAppDispatch()

  const handleExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget)
  }

  const handleCloseExportMenu = () => {
    setExportMenuAnchor(null)
  }

  return (
    <div className="fixed left-0 top-0 z-50 h-[50px] w-full bg-primary-500 text-accent-500">
      <div className="relative flex h-[50px] items-center px-2">
        {showLoadingBar && (
          <div className="absolute left-0 right-0 top-0 w-full">
            <LinearProgress color="secondary" />
          </div>
        )}

        <IconButton
          color="inherit"
          onClick={() => dispatch(toggleLeftDrawer())}
          className="mr-2"
          size="large"
          aria-label="open menu"
        >
          <FaBars />
        </IconButton>

        <div className="flex h-full items-center">
          <VersionedLink to="/" className="text-accent-500 no-underline hover:text-accent-200">
            <span className="mr-2 text-3xl font-bold">PAN-GO</span>
          </VersionedLink>
          <VersionedLink to="/" className="text-accent-500 no-underline hover:text-accent-200">
            <span className="text-3xl">Human Functionome</span>
          </VersionedLink>
        </div>

        <div className="hidden flex-1 items-center justify-end md:flex">
          <div className="flex items-center pr-3 text-accent-500">
            <IconButton
              color="inherit"
              href="https://github.com/pantherdb/pango"
              target="_blank"
              size="large"
            >
              <FaGithub />
            </IconButton>
          </div>

          <div className="flex items-center border-l border-accent-200 px-3">
            <Button
              color="inherit"
              className="!text-xl !text-accent-500 hover:text-accent-200"
              onClick={handleExportMenu}
            >
              Download
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleCloseExportMenu}
            >
              <MenuItem component="a" href={ENVIRONMENT.downloadAllDataCSVUrl}>
                All data as CSV
              </MenuItem>
              <MenuItem component="a" href={ENVIRONMENT.downloadAllDataJSONUrl}>
                All data as JSON
              </MenuItem>
              <MenuItem component="a" href={ENVIRONMENT.downloadAnnotationsGAFUrl}>
                Annotations as GAF
              </MenuItem>
              <MenuItem
                component="a"
                href={ENVIRONMENT.downloadEvolutionaryModelsGAFUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Evolutionary models as GAF
              </MenuItem>
            </Menu>
            <Button
              color="inherit"
              component={Link}
              className="!text-xl !text-accent-500 hover:text-accent-200"
              to="/about"
            >
              About
            </Button>
          </div>

          <div className="flex items-center">
            <div className="flex items-center border-l border-accent-200 px-4">
              <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/go-logo-yellow.png" alt="GO Logo" className="h-11" />
              </a>
            </div>
            <div className="flex items-center border-l border-accent-200 px-4">
              <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
                <img
                  src="/assets/images/logos/panther-logo-yellow.png"
                  alt="Panther Logo"
                  className="h-11"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toolbar
