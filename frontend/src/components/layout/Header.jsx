import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Search, ChevronRight, Wifi, WifiOff, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';

const pageTitles = {
  '/': 'Dashboard',
  '/map': 'Live Map',
  '/devices': 'Devices',
  '/history': 'Location History',
  '/geofences': 'Geofences',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connected, alerts } = useWebSocket();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const currentPage = pageTitles[location.pathname] || 'TrackLink';
  const pathParts = location.pathname.split('/').filter(Boolean);
  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/60 dark:bg-dark-900/60 backdrop-blur-xl border-b border-dark-200/50 dark:border-dark-700/50
                        flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="text-dark-400 dark:text-dark-500 hover:text-primary-500 transition-colors">
            Home
          </Link>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-dark-300 dark:text-dark-600" />
              <span className={i === pathParts.length - 1 ? 'text-dark-700 dark:text-dark-200 font-medium' : 'text-dark-400 dark:text-dark-500'}>
                {part.charAt(0).toUpperCase() + part.slice(1)}
              </span>
            </span>
          ))}
          {pathParts.length === 0 && (
            <>
              <ChevronRight size={14} className="text-dark-300 dark:text-dark-600" />
              <span className="text-dark-700 dark:text-dark-200 font-medium">Dashboard</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                         ${connected
                           ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                           : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Live' : 'Offline'}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center
                       bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <Bell size={18} className="text-dark-500 dark:text-dark-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold
                              rounded-full flex items-center justify-center animate-scale-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 glass-strong rounded-2xl shadow-xl overflow-hidden animate-fade-in-down z-50">
              <div className="p-4 border-b border-dark-200/50 dark:border-dark-700/50">
                <h3 className="font-semibold text-dark-800 dark:text-dark-200">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-dark-400 text-sm">No notifications</div>
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className="p-3 hover:bg-dark-50 dark:hover:bg-dark-800 border-b border-dark-100 dark:border-dark-700/50 transition-colors">
                      <p className="text-sm text-dark-700 dark:text-dark-300">{alert.message || 'New alert'}</p>
                      <p className="text-xs text-dark-400 mt-1">{alert.type || 'alert'}</p>
                    </div>
                  ))
                )}
              </div>
              <Link to="/alerts" onClick={() => setShowNotifications(false)}
                    className="block p-3 text-center text-sm text-primary-500 hover:bg-dark-50 dark:hover:bg-dark-800 font-medium transition-colors">
                View all alerts
              </Link>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-dark-700 dark:text-dark-300 hidden md:block">
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 glass-strong rounded-2xl shadow-xl overflow-hidden animate-fade-in-down z-50">
              <div className="p-4 border-b border-dark-200/50 dark:border-dark-700/50">
                <p className="font-semibold text-dark-800 dark:text-dark-200 text-sm">{user?.full_name || 'User'}</p>
                <p className="text-xs text-dark-400 mt-0.5">{user?.email || 'user@tracklink.io'}</p>
              </div>
              <div className="py-1">
                <Link to="/settings" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-600 dark:text-dark-300
                                hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
                  <Settings size={16} />
                  Settings
                </Link>
                <button onClick={logout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 w-full
                                  hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
