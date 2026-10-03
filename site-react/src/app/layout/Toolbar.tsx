import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { FaBars, FaGithub, FaSearch, FaDownload, FaInfoCircle, FaQuestion } from 'react-icons/fa'
import { IoMdClose } from 'react-icons/io'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { toggleLeftDrawer } from '@/@pango.core/components/drawer/drawerSlice'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { useConfig } from '@/@pango.core/data/useConfig'
import GeneSearch from '@/features/genes/components/GeneSearch'
import { handleExternalLinkClick } from '@/analytics'
import { ActionIcon, Button, Menu, Popover } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { VersionedButton } from '@/shared/components/VersionedButton'

interface ToolbarProps {
  showLoadingBar?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ showLoadingBar }) => {
  const config = useConfig()
  const isMobile = useMediaQuery('(max-width: 599.99px)')
  const [showSearch, setShowSearch] = useState(false)
  const [showLogos, setShowLogos] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef?.current && !popoverRef?.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const downloadItems = (
    <>
      <Menu.Item
        component="a"
        href={config.DOWNLOAD_ALL_DATA_CSV_URL}
        onClick={() => handleExternalLinkClick(config.DOWNLOAD_ALL_DATA_CSV_URL)}
      >
        All data as CSV
      </Menu.Item>
      <Menu.Item
        component="a"
        href={config.DOWNLOAD_ALL_DATA_JSON_URL}
        onClick={() => handleExternalLinkClick(config.DOWNLOAD_ALL_DATA_JSON_URL)}
      >
        All data as JSON
      </Menu.Item>
      <Menu.Item
        component="a"
        href={config.DOWNLOAD_ANNOTATIONS_GAF_URL}
        onClick={() => handleExternalLinkClick(config.DOWNLOAD_ANNOTATIONS_GAF_URL)}
      >
        Annotations as GAF
      </Menu.Item>
      <Menu.Item
        component="a"
        href={config.DOWNLOAD_EVOLUTIONARY_MODELS_GAF_URL}
        onClick={() => handleExternalLinkClick(config.DOWNLOAD_EVOLUTIONARY_MODELS_GAF_URL)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Evolutionary models as GAF
      </Menu.Item>
      <Menu.Item
        component="a"
        href={config.DOWNLOAD_ONTOLOGY_FILES_URL}
        onClick={() => handleExternalLinkClick(config.DOWNLOAD_ONTOLOGY_FILES_URL)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ontology Files
      </Menu.Item>
    </>
  )

  const renderLogos = () => (
    <div className="flex items-center">
      {isMobile ? (
        <Popover
          opened={showLogos}
          onChange={setShowLogos}
          position="bottom-end"
          withinPortal
        >
          <Popover.Target>
            <button className="!w-8 !p-0" onClick={() => setShowLogos(o => !o)}>
              <img
                src="/assets/images/logos/go-logo-yellow-icon.png"
                alt="GO Logo"
                className="!h-6"
              />
            </button>
          </Popover.Target>
          <Popover.Dropdown className="!bg-primary-600 !p-4">
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
          </Popover.Dropdown>
        </Popover>
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
        <ActionIcon
          variant="subtle"
          color="gray"
          className="!w-5 !p-0 !mx-1.5 !text-accent-500"
          onClick={() => setShowSearch(true)}
          size="md"
        >
          <FaSearch />
        </ActionIcon>
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
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                className="!w-5 !p-0 !mx-1.5 !text-accent-500"
                size="md"
              >
                <FaDownload />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>{downloadItems}</Menu.Dropdown>
          </Menu>
          <ActionIcon
            variant="subtle"
            color="gray"
            className="!w-5 !p-0 !mx-1.5 !text-accent-500"
            component={Link}
            to="/about"
            size="md"
          >
            <FaInfoCircle />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            className="!w-5 !p-0 !mx-1.5 !text-accent-500"
            component={Link}
            to="/help"
            size="md"
          >
            <FaQuestion />
          </ActionIcon>
        </>
      ) : (
        <>
          <Menu>
            <Menu.Target>
              <Button variant="subtle" className="!text-accent-500 hover:text-accent-200">
                Download
              </Button>
            </Menu.Target>
            <Menu.Dropdown>{downloadItems}</Menu.Dropdown>
          </Menu>
          <VersionedButton
            variant="subtle"
            className="!text-accent-500 hover:text-accent-200"
            to="/about"
          >
            About
          </VersionedButton>
          <VersionedButton
            variant="subtle"
            className="!text-accent-500 hover:text-accent-200"
            to="/help"
          >
            Help
          </VersionedButton>
        </>
      )}
    </div>
  )

  return (
    <div className="fixed left-0 top-0 z-50 h-[50px] w-full bg-primary-500 text-accent-500">
      <div className="relative flex h-full items-center px-1 md:px-2">
        {showLoadingBar && (
          <div
            role="progressbar"
            className="absolute left-0 right-0 top-0 h-1 w-full overflow-hidden bg-accent-100"
          >
            <div className="h-full w-1/3 animate-[loadingBar_1.5s_ease-in-out_infinite] bg-accent-500" />
          </div>
        )}
        {!showSearch ? (
          <>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => dispatch(toggleLeftDrawer())}
              className="mr-2 md:mr-1 !text-accent-500"
              size="md"
              aria-label="open menu"
            >
              <FaBars />
            </ActionIcon>
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
              <ActionIcon
                variant="subtle"
                color="gray"
                className="!w-5 !p-0 !mx-1.5 md:!mr-2 !text-accent-500"
                onClick={() => handleExternalLinkClick('https://github.com/pantherdb/pango')}
                component="a"
                href="https://github.com/pantherdb/pango"
                target="_blank"
                size="md"
              >
                <FaGithub />
              </ActionIcon>

              {renderNavigation()}
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
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setShowSearch(false)}
                className="!text-accent-500"
                size="md"
              >
                <IoMdClose />
              </ActionIcon>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Toolbar
