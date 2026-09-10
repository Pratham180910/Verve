import React from 'react';
import { useAuth } from '../context/AuthContext';

const RolePlaceholder = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
          V
        </div>
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 mb-3">
          {user?.role} Portal
        </span>
        <h2 className="text-2xl font-semibold text-slate-900 mb-1">
          Welcome, {user?.name}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Authenticated as <strong className="text-slate-700">{user?.email}</strong>
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 mb-6 text-left space-y-1">
          <div><strong>Role:</strong> {user?.role}</div>
          <div><strong>Status:</strong> Authenticated via JWT</div>
          <div className="text-amber-600 mt-1">Dashboard UI will be built in the next feature.</div>
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default RolePlaceholder;
