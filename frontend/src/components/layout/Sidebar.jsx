import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Smartphone, History, Circle, Bell, Settings,
  ChevronLeft, ChevronRight, MapPin, LogOut, User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const icons = { LayoutDashboard, Map, Smartphone, History, Circle, Bell, Settings };

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/map', label: 'Live Map', icon: 'Map' },
  { path: '/devices', label: 'Devices', icon: 'Smartphone' },
  { path: '/history', label: 'History', icon: 'History' },
  { path: '/geofences', label: 'Geofences', icon: 'Circle' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col
                  bg-white/80 dark:bg-dark-900/90 backdrop-blur-xl
                  border-r border-dark-200/50 dark:border-dark-700/50
                  transition-all duration-300 ease-in-out
                  ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-dark-200/50 dark:border-dark-700/50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <MapPin size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold gradient-text">TrackLink</h1>
            <p className="text-[10px] text-dark-400 dark:text-dark-500 -mt-0.5 font-medium tracking-wider uppercase">Real-Time Tracking</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                            : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-700 dark:hover:text-dark-200'
                          }
                          ${collapsed ? 'justify-center' : ''}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
              )}
              <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-primary-500' : ''}`} />
              {!collapsed && <span className="animate-fade-in text-sm">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-dark-800 text-white text-xs rounded-lg
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all
                                whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={`p-3 border-t border-dark-200/50 dark:border-dark-700/50 space-y-2`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <ThemeToggle />
          {!collapsed && (
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center
                        bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600
                        transition-all duration-200"
            >
              <ChevronLeft size={18} className="text-dark-500" />
            </button>
          )}
        </div>

        {/* User profile */}
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-dark-50 dark:bg-dark-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-semibold text-dark-700 dark:text-dark-200 truncate">
                {user?.full_name || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-dark-400 dark:text-dark-500 truncate">
                {user?.email || 'user@tracklink.io'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
              title="Logout"
            >
              <LogOut size={14} className="text-dark-400" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-2 rounded-xl
                      bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600
                      transition-all duration-200"
          >
            <ChevronRight size={18} className="text-dark-500" />
          </button>
        )}
      </div>
    </aside>
  );
}
