import { useConfig } from '@/@pango.core/data/useConfig'
import { VersionedLink } from '@/shared/components/VersionedLink'
import type React from 'react'

const Footer: React.FC = () => {
  const config = useConfig()
  const currentYear = new Date().getFullYear()

  return (
    <div className="h-[300px] flex flex-row items-start bg-gradient-to-r  from-[#0e2a3b] to-[#34306b] p-4 py-10 md:px-24 text-white">
      <div className="flex flex-1 flex-row items-start">
        <div className="mr-4">
          <VersionedLink to="/" className="text-white">
            Home
          </VersionedLink>
        </div>
        <div className="mr-4">
          <a
            href={config.contactUrl}
            className="text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us
          </a>
        </div>
      </div>
      <span className="flex-grow"></span>
      <div className="flex-1 text-right">
        <small>
          Copyright © {currentYear} The Gene Ontology Consortium is supported by a U24 grant from
          the National Institutes of Health [grant U24 HG012212]
        </small>
      </div>
    </div>
  )
}

export default Footer
