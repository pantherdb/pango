import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import {
  IconButton,
  Button,
  Menu,
  MenuItem,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Popper,
  Paper,
  ClickAwayListener,
} from '@mui/material'
import { FaBars, FaGithub, FaSearch, FaDownload, FaInfoCircle } from 'react-icons/fa'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showLogos, setShowLogos] = useState(false)
  const [logosAnchorEl, setLogosAnchorEl] = useState<null | HTMLElement>(null)
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

  const handleLogosClick = (event: React.MouseEvent<HTMLElement>) => {
    setLogosAnchorEl(event.currentTarget)
    setShowLogos(!showLogos)
  }

  const handleLogosClose = () => {
    setLogosAnchorEl(null)
    setShowLogos(false)
  }

  const renderLogos = () => (
    <div className="flex items-center">
      {isMobile ? (
        <>
          <button className="!w-11 !p-0" onClick={handleLogosClick}>
            <img
              src="/assets/images/logos/go-logo-yellow-icon.png"
              alt="GO Logo"
              className="h-12"
            />
          </button>
          <Popper open={showLogos} anchorEl={logosAnchorEl} placement="bottom-end">
            <ClickAwayListener onClickAway={handleLogosClose}>
              <Paper className="bg-primary-600 p-4">
                <div className="flex flex-col gap-4">
                  <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/assets/images/logos/go-logo-yellow.png"
                      alt="GO Logo"
                      className="h-10"
                    />
                  </a>
                  <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/assets/images/logos/panther-logo-yellow.png"
                      alt="Panther Logo"
                      className="h-10"
                    />
                  </a>
                </div>
              </Paper>
            </ClickAwayListener>
          </Popper>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  )

  const renderSearch = () => (
    <div className="flex items-center pr-3 text-accent-500">
      {isMobile ? (
        <IconButton
          color="inherit"
          className="!w-11 !p-0"
          onClick={() => setShowSearch(true)}
          size="large"
        >
          <FaSearch />
        </IconButton>
      ) : (
        <div className="relative mr-2 flex items-center">
          <input
            type="text"
            placeholder="Search Gene..."
            className="h-12 rounded-full bg-white py-2 pl-10 pr-4"
            onClick={() => setShowSearch(true)}
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
        </div>
      )}
    </div>
  )

  const renderNavigation = () => (
    <div className="flex items-center border-l-0 border-accent-200 px-3 md:border-l">
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            className="!w-11 !p-0"
            onClick={handleExportMenu}
            size="large"
          >
            <FaDownload />
          </IconButton>
          <IconButton
            color="inherit"
            className="!w-11 !p-0"
            component={Link}
            to="/about"
            size="large"
          >
            <FaInfoCircle />
          </IconButton>
        </>
      ) : (
        <>
          <Button
            color="inherit"
            className="!text-xl !text-accent-500 hover:text-accent-200"
            onClick={handleExportMenu}
          >
            Download
          </Button>
          <Button
            color="inherit"
            component={Link}
            className="!text-xl !text-accent-500 hover:text-accent-200"
            to="/about"
          >
            About
          </Button>
          <Button
            color="inherit"
            component={Link}
            className="!text-xl !text-accent-500 hover:text-accent-200"
            to="/help"
          >
            Help
          </Button>
        </>
      )}
    </div>
  )

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
            <div className="flex h-full flex-col items-start justify-center md:flex-row md:items-center">
              <VersionedLink
                to="/"
                className="mr-2 text-accent-500 no-underline hover:text-accent-200"
              >
                <span className="text-2xl font-bold md:text-3xl">PAN-GO</span>
              </VersionedLink>
              <VersionedLink to="/" className="text-accent-500 no-underline hover:text-accent-200">
                <span className="text-lg md:text-3xl">Human Functionome</span>
              </VersionedLink>
            </div>

            <div className="flex flex-1 items-center justify-end">
              {renderSearch()}
              <IconButton
                color="inherit"
                className="!w-11 !p-0"
                href="https://github.com/pantherdb/pango"
                target="_blank"
                size="large"
              >
                <FaGithub />
              </IconButton>

              {renderNavigation()}

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
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadOntologyFilesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ontology Files
                </MenuItem>
              </Menu>

              {renderLogos()}
            </div>
          </>
        ) : (
          <div ref={searchRef} className="flex w-full items-center justify-center space-x-4">
            <div className="hidden text-lg font-semibold text-accent-500 sm:block">
              Search Genes
            </div>
            <div className="flex w-full md:w-[500px]">
              <div className="relative flex-1">
                <GeneSearch
                  popoverRef={popoverRef}
                  isOpen={showSearch}
                  onClose={() => setShowSearch(false)}
                />
              </div>
              <IconButton onClick={() => setShowSearch(false)} color="inherit" size="large">
                <IoMdClose />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Toolbar
