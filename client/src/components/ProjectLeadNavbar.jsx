import React, { useState } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const ProjectLeadNavbar = ({ onToggleSidebar, onSearch, searchQuery = '' }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getInitials = (name = '') => {
    if (!name) return 'PL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#f8f9fa]/90 backdrop-blur-md border-b border-slate-200/70 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-[1440px] mx-auto">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 focus:outline-none transition-colors cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              Verve
            </span>
            <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
              Project Lead
            </span>
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-slate-200/50 transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:flex flex-col leading-tight pr-1">
                <span className="text-xs font-bold text-slate-900">
                  {user?.name || 'Project Lead User'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Project Lead
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Menu Popover */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors mt-1 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProjectLeadNavbar;
