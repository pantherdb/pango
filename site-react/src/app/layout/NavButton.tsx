import type React from 'react'
import type { IconType } from 'react-icons'
import { Link } from 'react-router-dom'

interface NavButtonProps {
  icon: IconType
  label: string
  path: string
}

interface NavItem {
  icon: IconType
  label: string
  path: string
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, path }) => (
  <Link to={path} className="group block w-full no-underline">
    <div className="flex flex-col items-center justify-center rounded-lg p-4 transition-all duration-200 hover:bg-blue-50 hover:shadow-md">
      <div className="rounded-full bg-blue-100 p-2 transition-colors duration-200 group-hover:bg-blue-200">
        <Icon className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-blue-600">
        {label}
      </span>
    </div>
  </Link>
)

export type { NavItem, NavButtonProps }

export default NavButton
