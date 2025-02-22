import Button from '@mui/material/Button'
import type React from 'react'

interface IconButtonProps {
  variant?: 'contained' | 'outlined' | 'text'
  icon: React.ReactNode
  onClick?: Function
  className?: string
}

export const IconButton = ({
  variant = 'text',
  icon,
  onClick,
  className = '',
}: IconButtonProps) => (
  <Button
    variant={variant}
    onClick={onClick as any}
    className={`h-20 w-20 !min-w-0 !rounded-full border-white bg-gray-500/50 !p-0 text-white ${className}`}
  >
    {icon}
  </Button>
)
