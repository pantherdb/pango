import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { FaBars, FaGithub, FaSearch, FaDownload, FaInfoCircle, FaQuestion } from 'react-icons/fa'
import { IoMdClose } from 'react-icons/io'
import { Link } from 'react-router-dom'
import { ActionIcon, Button, Menu, Popover } from '@mantine/core'
import { useAppDispatch } from '../hooks'
import { toggleLeftDrawer } from '@/@pango.core/components/drawer/drawerSlice'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { VersionedButton } from '@/shared/components/VersionedButton'
import { useConfig } from '@/@pango.core/data/useConfig'
import GeneSearch from '@/features/genes/components/GeneSearch'
import type { GeneSearchCloseReason } from '@/features/genes/components/GeneSearch'
import { handleExternalLinkClick } from '@/analytics'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { withApiVersion } from '@/shared/utils/withApiVersion'

interface ToolbarProps {
  showLoadingBar?: boolean
}

const ICON_BUTTON_CLASS = 'mx-1.5 text-accent-500'
const NAV_BUTTON_CLASS = 'text-accent-500 hover:text-accent-200'

const Toolbar: React.FC<ToolbarProps> = ({ showLoadingBar }) => {
  const config = useConfig()
  const isMobile = useIsMobile()
  const [showSearch, setShowSearch] = useState(false)
  const [showLogos, setShowLogos] = useState(false)
  // The search row (title, field, close button): presses inside it never dismiss the search.
  const [searchArea, setSearchArea] = useState<HTMLDivElement | null>(null)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const restoreTriggerFocus = useRef(false)
  const dispatch = useAppDispatch()

  const openSearch = () => setShowSearch(true)
  const closeSearch = (reason: GeneSearchCloseReason | 'button') => {
    // Escape and the close button hand focus back to the trigger; after a press elsewhere the
    // pressed element keeps it.
    restoreTriggerFocus.current = reason !== 'outside'
    setShowSearch(false)
  }

  useEffect(() => {
    if (showSearch || !restoreTriggerFocus.current) return
    restoreTriggerFocus.current = false
    searchTrigger.current?.focus()
  }, [showSearch])

  const downloads = [
    { label: 'All data as CSV', href: config.DOWNLOAD_ALL_DATA_CSV_URL },
    { label: 'All data as JSON', href: config.DOWNLOAD_ALL_DATA_JSON_URL },
    { label: 'Annotations as GAF', href: config.DOWNLOAD_ANNOTATIONS_GAF_URL },
    {
      label: 'Evolutionary models as GAF',
      href: config.DOWNLOAD_EVOLUTIONARY_MODELS_GAF_URL,
      newTab: true,
    },
    { label: 'Ontology Files', href: config.DOWNLOAD_ONTOLOGY_FILES_URL, newTab: true },
  ]

  const downloadItems = downloads.map(({ label, href, newTab }) => (
    <Menu.Item
      key={label}
      component="a"
      href={href}
      onClick={() => handleExternalLinkClick(href)}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </Menu.Item>
  ))

  const renderLogos = () => (
    <div className="flex items-center">
      {isMobile ? (
        <Popover opened={showLogos} onChange={setShowLogos} position="bottom-end">
          <Popover.Target>
            <button type="button" className="w-8 p-0" onClick={() => setShowLogos(o => !o)}>
              <img
                src="/assets/images/logos/go-logo-yellow-icon.png"
                alt="GO and PANTHER sites"
                className="h-6"
              />
            </button>
          </Popover.Target>
          <Popover.Dropdown className="bg-primary-600 p-4">
            <div className="flex flex-col gap-2">
              <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/go-logo-yellow.png" alt="GO Logo" className="h-8" />
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
          ref={searchTrigger}
          className={ICON_BUTTON_CLASS}
          onClick={openSearch}
          aria-label="Search genes"
        >
          <FaSearch />
        </ActionIcon>
      ) : (
        <div className="relative mr-1 flex items-center">
          {/* Looks like a field, but it is the button that opens the gene search. */}
          <button
            ref={searchTrigger}
            type="button"
            onClick={openSearch}
            aria-label="Search genes"
            className="h-8 w-56 rounded-full bg-white py-2 pr-4 pl-8 text-left text-gray-500"
          >
            Search Gene...
          </button>
          <FaSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500" />
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
              <ActionIcon className={ICON_BUTTON_CLASS} aria-label="Downloads">
                <FaDownload />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>{downloadItems}</Menu.Dropdown>
          </Menu>
          <ActionIcon
            className={ICON_BUTTON_CLASS}
            component={Link}
            to={withApiVersion('/about')}
            aria-label="About"
          >
            <FaInfoCircle />
          </ActionIcon>
          <ActionIcon
            className={ICON_BUTTON_CLASS}
            component={Link}
            to={withApiVersion('/help')}
            aria-label="Help"
          >
            <FaQuestion />
          </ActionIcon>
        </>
      ) : (
        <>
          <Menu>
            <Menu.Target>
              <Button variant="subtle" className={NAV_BUTTON_CLASS}>
                Download
              </Button>
            </Menu.Target>
            <Menu.Dropdown>{downloadItems}</Menu.Dropdown>
          </Menu>
          <VersionedButton variant="subtle" className={NAV_BUTTON_CLASS} to="/about">
            About
          </VersionedButton>
          <VersionedButton variant="subtle" className={NAV_BUTTON_CLASS} to="/help">
            Help
          </VersionedButton>
        </>
      )}
    </div>
  )

  return (
    <div className="fixed top-0 left-0 z-50 h-[50px] w-full bg-primary-500 text-accent-500">
      <div className="relative flex h-full items-center px-1 md:px-2">
        {showLoadingBar && (
          <div
            role="progressbar"
            aria-label="Loading"
            className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-accent-100"
          >
            <div className="h-full w-1/3 animate-loading-bar bg-accent-500" />
          </div>
        )}
        {!showSearch ? (
          <>
            <ActionIcon
              onClick={() => dispatch(toggleLeftDrawer())}
              className="mr-2 text-accent-500 md:mr-1"
              aria-label="Toggle filter panel"
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
                className={`${ICON_BUTTON_CLASS} md:mr-2`}
                onClick={() => handleExternalLinkClick('https://github.com/pantherdb/pango')}
                component="a"
                href="https://github.com/pantherdb/pango"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PAN-GO on GitHub"
              >
                <FaGithub />
              </ActionIcon>

              {renderNavigation()}
              {renderLogos()}
            </div>
          </>
        ) : (
          <div ref={setSearchArea} className="flex w-full items-center justify-center space-x-4">
            <div className="hidden text-lg font-semibold text-accent-500 sm:block">
              Search Genes
            </div>
            <div className="flex w-full md:w-3/5">
              <div className="relative flex-1">
                <GeneSearch onClose={closeSearch} area={searchArea} />
              </div>
              <ActionIcon
                onClick={() => closeSearch('button')}
                className="text-accent-500"
                aria-label="Close search"
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
