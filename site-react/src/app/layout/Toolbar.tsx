import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { FaBars, FaGithub, FaSearch, FaDownload, FaInfoCircle, FaQuestion } from 'react-icons/fa'
import { IoMdClose } from 'react-icons/io'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { toggleLeftDrawer } from '@/@pango.core/components/drawer/drawerSlice'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import GeneSearch from '@/features/genes/components/GeneSearch'
import { handleExternalLinkClick } from '@/analytics'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Popper from '@mui/material/Popper'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'

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
          <button className="!w-8 !p-0" onClick={handleLogosClick}>
            <img
              src="/assets/images/logos/go-logo-yellow-icon.png"
              alt="GO Logo"
              className="!h-6"
            />
          </button>
          <Popper open={showLogos} anchorEl={logosAnchorEl} placement="bottom-end">
            <ClickAwayListener onClickAway={handleLogosClose}>
              <Paper className="bg-primary-600 p-4">
                <div className="flex flex-col gap-2">
                  <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/assets/images/logos/go-logo-yellow.png"
                      alt="GO Logo"
                      className="h-8"
                    />
                  </a>
                  <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/assets/images/logos/panther-logo-yellow.png"
                      alt="Panther Logo"
                      className="h-8"
                    />
                  </a>
                </div>
              </Paper>
            </ClickAwayListener>
          </Popper>
        </>
      ) : (
        <>
          <div className="flex items-center border-l border-accent-200 px-2">
            <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
              <img src="/assets/images/logos/go-logo-yellow.png" alt="GO Logo" className="h-7" />
            </a>
          </div>
          <div className="flex items-center border-l border-accent-200 px-4">
            <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
              <img
                src="/assets/images/logos/panther-logo-yellow.png"
                alt="Panther Logo"
                className="h-7"
              />
            </a>
          </div>
        </>
      )}
    </div>
  )

  const renderSearch = () => (
    <div className="flex items-center text-accent-500 md:pr-2">
      {isMobile ? (
        <IconButton
          color="inherit"
          className="!w-5 !p-0 !mx-1.5"
          onClick={() => setShowSearch(true)}
          size="medium"
        >
          <FaSearch />
        </IconButton>
      ) : (
        <div className="relative mr-1 flex items-center">
          <input
            type="text"
            placeholder="Search Gene..."
            className="h-8 rounded-full bg-white py-2 pl-8 pr-4"
            onClick={() => setShowSearch(true)}
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
        </div>
      )}
    </div>
  )

  const renderNavigation = () => (
    <div className="flex items-center border-l-0 border-accent-200 md:border-l md:px-2">
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            className="!w-5 !p-0 !mx-1.5"
            onClick={handleExportMenu}
            size="medium"
          >
            <FaDownload />
          </IconButton>
          <IconButton
            color="inherit"
            className="!w-5 !p-0 !mx-1.5"
            component={Link}
            to="/about"
            size="medium"
          >
            <FaInfoCircle />
          </IconButton>
          <IconButton
            color="inherit"
            className="!w-5 !p-0 !mx-1.5"
            component={Link}
            to="/help"
            size="medium"
          >
            <FaQuestion />
          </IconButton>
        </>
      ) : (
        <>
          <Button
            color="inherit"
            className="!text-accent-500 hover:text-accent-200"
            onClick={handleExportMenu}
          >
            Download
          </Button>
          <Button
            color="inherit"
            component={Link}
            className="!text-accent-500 hover:text-accent-200"
            to="/about"
          >
            About
          </Button>
          <Button
            color="inherit"
            component={Link}
            className="!text-accent-500 hover:text-accent-200"
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
      <div className="relative flex h-full items-center px-1 md:px-2">
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
              className="mr-2 md:mr-1"
              size="medium"
              aria-label="open menu"
            >
              <FaBars />
            </IconButton>
            <div className="flex flex-col items-start justify-center md:flex-row md:items-center">
              <VersionedLink
                to="/"
                className="text-accent-500 no-underline hover:text-accent-200 md:mr-2"
              >
                <span className="text-lg font-bold md:text-2xl">PAN-GO</span>
              </VersionedLink>
              <VersionedLink
                to="/"
                className="-mt-2 text-accent-500 no-underline hover:text-accent-200 md:mt-0"
              >
                <span className="text-xs md:text-2xl">Human Functionome</span>
              </VersionedLink>
            </div>

            <div className="flex flex-1 items-center justify-end">
              {renderSearch()}
              <IconButton
                color="inherit"
                className="!w-5 !p-0 !mx-1.5 md:!mr-2"
                onClick={() => handleExternalLinkClick('https://github.com/pantherdb/pango')}
                href="https://github.com/pantherdb/pango"
                target="_blank"
                size="medium"
              >
                <FaGithub />
              </IconButton>

              {renderNavigation()}

              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={handleCloseExportMenu}
              >
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadAllDataCSVUrl}
                  onClick={() => handleExternalLinkClick(ENVIRONMENT.downloadAllDataCSVUrl)}
                >
                  All data as CSV
                </MenuItem>
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadAllDataJSONUrl}
                  onClick={() => handleExternalLinkClick(ENVIRONMENT.downloadAllDataJSONUrl)}
                >
                  All data as JSON
                </MenuItem>
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadAnnotationsGAFUrl}
                  onClick={() => handleExternalLinkClick(ENVIRONMENT.downloadAnnotationsGAFUrl)}
                >
                  Annotations as GAF
                </MenuItem>
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadEvolutionaryModelsGAFUrl}
                  onClick={() =>
                    handleExternalLinkClick(ENVIRONMENT.downloadEvolutionaryModelsGAFUrl)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Evolutionary models as GAF
                </MenuItem>
                <MenuItem
                  component="a"
                  href={ENVIRONMENT.downloadOntologyFilesUrl}
                  onClick={() => handleExternalLinkClick(ENVIRONMENT.downloadOntologyFilesUrl)}
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
            <div className="flex w-full md:w-3/5">
              <div className="relative flex-1">
                <GeneSearch
                  popoverRef={popoverRef}
                  isOpen={showSearch}
                  onClose={() => setShowSearch(false)}
                />
              </div>
              <IconButton onClick={() => setShowSearch(false)} color="inherit" size="medium">
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
