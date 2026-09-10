import React, { useEffect } from 'react';
import { Home, CheckSquare, Folder, Users, BarChart2, User, X } from 'lucide-react';

const MemberSidebar = ({ isOpen, onClose, activePage = 'Dashboard', onNavigate }) => {
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

  // Member navigation must contain ONLY these 6 items:
  const navItems = [
    { name: 'Dashboard', icon: Home, pageKey: 'Dashboard' },
    { name: 'My Tasks', icon: CheckSquare, pageKey: 'My Tasks' },
    { name: 'My Projects', icon: Folder, pageKey: 'My Projects' },
    { name: 'My Team', icon: Users, pageKey: 'My Team' },
    { name: 'Activity', icon: BarChart2, pageKey: 'Activity' },
    { name: 'Profile', icon: User, pageKey: 'Profile' },
  ];

  const handleItemClick = (pageKey) => {
    if (onNavigate) {
      onNavigate(pageKey);
    }
    onClose();
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
                MEMBER PORTAL
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items (ONLY 6) */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.pageKey;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.pageKey)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
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
            “Small steps, big contributions.”
          </p>
          <div className="w-6 h-0.5 bg-slate-300 mt-2 rounded-full"></div>
        </div>
      </aside>
    </>
  );
};

export default MemberSidebar;
