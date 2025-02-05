import type React from 'react'
import { Link } from 'react-router-dom'

interface VersionedLinkProps {
  to: string
  children: React.ReactNode
  target?: string
  [key: string]: any
}

export const VersionedLink: React.FC<VersionedLinkProps> = ({ to, target, children, ...props }) => {
  const apiVersion = new URLSearchParams(window.location.search).get('apiVersion')
  const versionedTo = apiVersion
    ? `${to}${to.includes('?') ? '&' : '?'}apiVersion=${apiVersion}`
    : to

  return target ? (
    <a href={versionedTo} target={target} {...props}>
      {children}
    </a>
  ) : (
    <Link to={versionedTo} {...props}>
      {children}
    </Link>
  )
}
