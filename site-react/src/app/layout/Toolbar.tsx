import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { IconButton, Button, Menu, MenuItem, LinearProgress, InputAdornment, TextField } from '@mui/material'
import { FaBars, FaGithub, FaSearch } from 'react-icons/fa'
import { IoMdClose } from 'react-icons/io'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { toggleLeftDrawer } from '@/@pango.core/components/drawer/drawerSlice'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import GeneSearch from '@/features/genes/components/GeneSearch'

interface ToolbarProps {
  showLoadingBar?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ showLoadingBar }) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        //setShowSearch(false)
      }

      if (popoverRef?.current && !popoverRef?.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

        {!showSearch ? (
          <>
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


                <div className="flex items-center mr-2 relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="rounded-full h-12 bg-white pl-10 pr-4 py-2"
                    onClick={() => setShowSearch(true)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
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
          </>
        ) : (
          <div ref={searchRef} className="flex w-full items-center justify-center space-x-4">
            <div className="text-lg font-semibold text-accent-500">Search Genes</div>
            <div className="flex w-[800px] ">
              <div className='flex-1 relative'>
                <GeneSearch popoverRef={popoverRef} isOpen={showSearch} onClose={() => setShowSearch(false)} />
              </div>
              <IconButton
                onClick={() => setShowSearch(false)}
                color="inherit"
                size="large"
              >
                <IoMdClose />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}

export default Toolbar