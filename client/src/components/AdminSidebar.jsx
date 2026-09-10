import React, { useEffect } from 'react';
import { Home, Users, Folder, CheckSquare, UsersRound, BarChart2, Settings, X } from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose, activePage = 'Home', onNavigate }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { name: 'Home', icon: Home, pageKey: 'Home' },
    { name: 'Members', icon: Users, pageKey: 'Members' },
    { name: 'Projects', icon: Folder, pageKey: 'Projects' },
    { name: 'Teams', icon: UsersRound, pageKey: 'Teams' },
    { name: 'Tasks', icon: CheckSquare, pageKey: 'Tasks' },
    { name: 'Activity', icon: BarChart2, pageKey: 'Activity' },
    { name: 'Settings', icon: Settings, pageKey: 'Settings' },
  ];

  const handleItemClick = (pageKey) => {
    if (onNavigate) {
      onNavigate(pageKey);
    }
    onClose();
  };

  const getSidebarQuote = () => {
    if (activePage === 'Tasks') return '“Organize today for a brighter tomorrow.”';
    if (activePage === 'Activity') return '“Every action builds a stronger tomorrow.”';
    if (activePage === 'Settings') return '“Better clubs build a brighter tomorrow.”';
    if (activePage === 'Members') return '“Great people make great clubs.”';
    return '“Ideas grow when people work together.”';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[#fdfdfd] border-r border-slate-200/80 shadow-2xl rounded-r-3xl flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Header with close */}
        <div>
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900">Verve</span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                Navigation
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Menu"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.pageKey;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.pageKey)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-[#eef7f2] text-[#134e4a] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#1e6b52]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quote & Philosophy */}
        <div className="px-3 pt-6">
          <p className="text-xs font-serif italic text-slate-400 leading-relaxed">
            {getSidebarQuote()}
          </p>
          <div className="w-6 h-0.5 bg-slate-300 mt-2 rounded-full"></div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
