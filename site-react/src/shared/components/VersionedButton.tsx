import type React from 'react'
import type { ButtonProps } from '@mantine/core'
import { Button } from '@mantine/core'
import { Link } from 'react-router-dom'
import { withApiVersion } from '@/shared/utils/withApiVersion'

type VersionedButtonProps = ButtonProps & {
  /** In-app route, rendered as a router link. */
  to?: string
  /** URL rendered as a plain anchor. */
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
}

/** Mantine `Button` that links somewhere while keeping the current `?apiVersion=`. */
export const VersionedButton: React.FC<VersionedButtonProps> = ({ to, href, ...props }) => {
  if (to) return <Button component={Link} to={withApiVersion(to)} {...props} />
  if (href) return <Button component="a" href={withApiVersion(href)} {...props} />
  return <Button {...props} />
}
