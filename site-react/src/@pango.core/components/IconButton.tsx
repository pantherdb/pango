import Button from "@mui/material/Button";
import type React from "react";

interface IconButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const IconButton = (
  {
    variant = 'text',
    icon,
    onClick,
    className = ''
  }: IconButtonProps) => (

  <Button
    variant={variant}
    onClick={onClick}
    className={`!p-0 border-white !min-w-0 !rounded-full bg-gray-500/50 text-white h-20 w-20 ${className}`}>
    {icon}
  </Button>
);
