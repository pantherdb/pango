import type React from 'react'
import { Button } from '@mui/material'
import { Link } from 'react-router-dom'

interface VersionedButtonProps {
  to?: string
  href?: string
  children: React.ReactNode
  [key: string]: any
}

export const VersionedButton: React.FC<VersionedButtonProps> = ({
  to,
  href,
  children,
  ...props
}) => {
  const apiVersion = new URLSearchParams(window.location.search).get('apiVersion')

  const addVersionParam = (url: string) => {
    if (!apiVersion) return url
    return `${url}${url.includes('?') ? '&' : '?'}apiVersion=${apiVersion}`
  }

  if (to) {
    return (
      <Button component={Link} to={addVersionParam(to)} {...props}>
        {children}
      </Button>
    )
  }

  if (href) {
    return (
      <Button href={addVersionParam(href)} {...props}>
        {children}
      </Button>
    )
  }

  return <Button {...props}>{children}</Button>
}