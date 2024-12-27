import type React from 'react';
import type { IconType } from 'react-icons';
import { Link } from 'react-router-dom';

interface NavButtonProps {
  icon: IconType;
  label: string;
  path: string;
}

interface NavItem {
  icon: IconType;
  label: string;
  path: string;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, path }) => (
  <Link
    to={path}
    className="w-full block group no-underline"
  >
    <div className="flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:shadow-md">
      <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
        <Icon className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-blue-600">
        {label}
      </span>
    </div>
  </Link>
);

export type { NavItem, NavButtonProps };

export default NavButton;