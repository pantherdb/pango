import type React from 'react'
import { Link } from 'react-router-dom'
import { withApiVersion } from '@/shared/utils/withApiVersion'

type VersionedLinkProps = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
  to: string
}

/** In-app link that keeps the current `?apiVersion=`. With a `target` it renders a plain anchor. */
export const VersionedLink: React.FC<VersionedLinkProps> = ({ to, target, children, ...props }) => {
  const versionedTo = withApiVersion(to)

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
