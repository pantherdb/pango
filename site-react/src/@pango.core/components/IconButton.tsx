import { Button } from '@mantine/core'
import type React from 'react'

interface IconButtonProps {
  variant?: 'contained' | 'outlined' | 'text'
  icon: React.ReactNode
  onClick?: () => void
  className?: string
}

const VARIANT_MAP = {
  contained: 'filled',
  outlined: 'outline',
  text: 'subtle',
} as const

export const IconButton = ({
  variant = 'text',
  icon,
  onClick,
  className = '',
}: IconButtonProps) => (
  <Button
    variant={VARIANT_MAP[variant]}
    onClick={onClick}
    className={`h-20 w-20 !min-w-0 !rounded-full border-white bg-gray-500/50 !p-0 text-white ${className}`}
  >
    {icon}
  </Button>
)
