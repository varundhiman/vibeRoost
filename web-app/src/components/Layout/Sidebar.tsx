import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  StarIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  StarIcon as StarIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    iconActive: HomeIconSolid 
  },
  { 
    name: 'Communities', 
    href: '/communities', 
    icon: UserGroupIcon, 
    iconActive: UserGroupIconSolid 
  },
  { 
    name: 'Reviews', 
    href: '/reviews', 
    icon: StarIcon, 
    iconActive: StarIconSolid 
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: UserIcon, 
    iconActive: UserIconSolid 
  },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar: React.FC = () => {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
        <div className="flex-1 flex flex-col min-h-0 bg-dark-100 border-r border-dark-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-900/20 text-primary-400'
                        : 'text-dark-600 hover:bg-dark-200 hover:text-dark-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {React.createElement(
                        isActive ? item.iconActive : item.icon,
                        {
                          className: `mr-3 flex-shrink-0 h-6 w-6 ${
                            isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-dark-600'
                          }`,
                          'aria-hidden': true,
                        }
                      )}
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            
            {/* Create Review Button */}
            <div className="px-2 mt-6">
              <NavLink
                to="/reviews/create"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                <PlusIcon
                  className="mr-3 flex-shrink-0 h-6 w-6 text-white"
                  aria-hidden="true"
                />
                Create Review
              </NavLink>
            </div>
            
            {/* Secondary navigation */}
            <nav className="mt-8 px-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-dark-200 text-dark-800'
                        : 'text-dark-600 hover:bg-dark-200 hover:text-dark-800'
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6 text-dark-400 group-hover:text-dark-600"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar - TODO: Implement mobile menu */}
    </>
  );
};

export default Sidebar;