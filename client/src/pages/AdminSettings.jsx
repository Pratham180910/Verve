import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { authAPI, settingsAPI } from '../services/api';
import {
  Settings,
  Building2,
  User,
  Bell,
  Shield,
  Link,
  Database,
  Info,
  Globe,
  Calendar,
  Clock,
  Home,
  Check,
  Edit2,
  MapPin,
  Mail,
  FileText,
  Download,
  RotateCcw,
  UsersRound,
  FileCode,
  Trash2,
  ChevronRight,
  X,
  Lock,
  AlertCircle,
  GitBranch,
  CalendarDays,
  Activity,
  Layers,
  CheckCircle2,
  Key,
} from 'lucide-react';

const AdminSettings = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Preferences State
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('verve_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      language: 'en-US',
      dateFormat: 'MMM D, YYYY',
      timeFormat: '12h',
      defaultView: 'Dashboard',
    };
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('verve_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      taskAssignments: true,
      deadlineReminders: true,
      projectUpdates: true,
      teamChanges: false,
      systemAnnouncements: true,
    };
  });

  // Feedback State
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });

  // Club Info State
  const [clubInfo, setClubInfo] = useState({
    name: 'Verve',
    tagline: 'Coding & Technology Club',
    established: '2026',
    college: 'ABC College of Engineering',
    email: 'verve@college.edu',
    website: 'https://verveclub.edu',
    description: 'Empowering students through technology, collaboration, and innovation.',
  });
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [clubForm, setClubForm] = useState({ ...clubInfo });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Database statistics state
  const [dataStats, setDataStats] = useState({
    members: 0,
    projects: 0,
    teams: 0,
    tasks: 0,
    activities: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Danger modal state
  const [showDangerNotice, setShowDangerNotice] = useState(false);

  // Navigation Items (Appearance REMOVED completely)
  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'club', label: 'Club Profile', icon: Building2 },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Privacy & Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: 'success' }), 3500);
  };

  // Fetch club profile and stats on load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clubRes, statsRes] = await Promise.all([
          settingsAPI.getClubProfile().catch(() => null),
          settingsAPI.getDataStats().catch(() => null),
        ]);

        if (clubRes?.success && clubRes.data) {
          setClubInfo(clubRes.data);
          setClubForm(clubRes.data);
        }
        if (statsRes?.success && statsRes.stats) {
          setDataStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    };
    loadInitialData();
  }, []);

  // Save General Preferences
  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('verve_preferences', JSON.stringify(preferences));
    showToast('General preferences saved successfully!');
  };

  // Save Club Profile
  const handleSaveClubProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await settingsAPI.updateClubProfile(clubForm);
      if (res.success) {
        setClubInfo(res.data);
        setIsEditingClub(false);
        showToast('Club profile updated successfully!');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update club profile', 'error');
    }
  };

  // Save Notifications
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem('verve_notifications', JSON.stringify(notifications));
    showToast('Notification preferences saved successfully!');
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await authAPI.changePassword(passwordForm);
      if (res.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Password changed successfully!');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Export Club Data
  const handleExportData = async () => {
    try {
      const res = await settingsAPI.exportClubData();
      if (res.success && res.export) {
        const blob = new Blob([JSON.stringify(res.export, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verve_club_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Club data exported successfully (sensitive data excluded)!');
      }
    } catch (err) {
      showToast(err.message || 'Failed to export data', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Settings"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-4 pr-0 lg:pr-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              SETTINGS
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.1] font-serif">
              Customize your <br className="hidden sm:inline" />
              club experience.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Manage your account, club information, preferences, and more.
            </p>
          </div>

          {/* Architectural Banner */}
          <div className="lg:col-span-6">
            <div className="relative h-[210px] sm:h-[240px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="People Ideas Community Impact banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

              <div className="absolute top-6 left-8 text-white/90 font-serif text-sm sm:text-base font-bold tracking-wider leading-snug drop-shadow-sm select-none">
                PEOPLE <br />
                IDEAS <br />
                COMMUNITY <br />
                IMPACT
              </div>

              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
                <p className="text-xs sm:text-sm font-serif italic text-white/95 leading-snug">
                  Small changes. <br />
                  A stronger club tomorrow.
                </p>
                <div className="w-12 h-[2px] bg-emerald-400/60 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in duration-200 ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Settings Navigation & Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Card (Appearance REMOVED) */}
          <aside className="lg:col-span-3 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'club') {
                      setClubForm({ ...clubInfo });
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#eef7f2] text-[#134e4a]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#1e6b52]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Content Area */}
          <div
            className={
              activeTab === 'general'
                ? 'lg:col-span-5 space-y-6'
                : 'lg:col-span-9 space-y-6'
            }
          >
            {/* 1. GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-serif">
                    General Settings
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Basic preferences for your club management experience.
                  </p>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-4">
                  {/* Language */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block">
                        Language
                      </label>
                      <span className="text-[11px] text-slate-400 block">
                        Choose your preferred language for the application.
                      </span>
                    </div>
                    <div className="relative min-w-[160px]">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({ ...preferences, language: e.target.value })
                        }
                        className="w-full appearance-none pl-9 pr-7 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-UK">English (UK)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Format */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block">
                        Date Format
                      </label>
                      <span className="text-[11px] text-slate-400 block">
                        Select how dates are displayed across the platform.
                      </span>
                    </div>
                    <div className="relative min-w-[190px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) =>
                          setPreferences({ ...preferences, dateFormat: e.target.value })
                        }
                        className="w-full appearance-none pl-9 pr-7 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        <option value="MMM D, YYYY">Sep 3, 2026 (MMM D, YYYY)</option>
                        <option value="YYYY-MM-DD">2026-09-03 (YYYY-MM-DD)</option>
                        <option value="DD/MM/YYYY">03/09/2026 (DD/MM/YYYY)</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Format */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block">
                        Time Format
                      </label>
                      <span className="text-[11px] text-slate-400 block">
                        Choose between 12-hour or 24-hour time format.
                      </span>
                    </div>
                    <div className="relative min-w-[160px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={preferences.timeFormat}
                        onChange={(e) =>
                          setPreferences({ ...preferences, timeFormat: e.target.value })
                        }
                        className="w-full appearance-none pl-9 pr-7 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                  </div>

                  {/* Default View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block">
                        Default View
                      </label>
                      <span className="text-[11px] text-slate-400 block">
                        Set your default landing page after login.
                      </span>
                    </div>
                    <div className="relative min-w-[160px]">
                      <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={preferences.defaultView}
                        onChange={(e) =>
                          setPreferences({ ...preferences, defaultView: e.target.value })
                        }
                        className="w-full appearance-none pl-9 pr-7 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        <option value="Dashboard">Dashboard</option>
                        <option value="Projects">Projects</option>
                        <option value="Tasks">Tasks</option>
                        <option value="Activity">Activity</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. CLUB PROFILE */}
            {activeTab === 'club' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-serif">
                      Club Profile
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage public club identity and organizational details.
                    </p>
                  </div>
                  {!isEditingClub ? (
                    <button
                      type="button"
                      onClick={() => {
                        setClubForm({ ...clubInfo });
                        setIsEditingClub(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingClub(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isEditingClub ? (
                  <form onSubmit={handleSaveClubProfile} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={clubForm.name}
                          onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tagline / Focus
                        </label>
                        <input
                          type="text"
                          value={clubForm.tagline}
                          onChange={(e) => setClubForm({ ...clubForm, tagline: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          College / Organization
                        </label>
                        <input
                          type="text"
                          value={clubForm.college}
                          onChange={(e) => setClubForm({ ...clubForm, college: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Established Year
                        </label>
                        <input
                          type="text"
                          value={clubForm.established}
                          onChange={(e) => setClubForm({ ...clubForm, established: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Club Email
                        </label>
                        <input
                          type="email"
                          value={clubForm.email}
                          onChange={(e) => setClubForm({ ...clubForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={clubForm.website}
                          onChange={(e) => setClubForm({ ...clubForm, website: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Club Mission & Description
                      </label>
                      <textarea
                        rows="3"
                        value={clubForm.description}
                        onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditingClub(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-[#1e3a2f] text-white text-2xl font-bold flex items-center justify-center shadow-xs">
                        {clubInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{clubInfo.name}</h3>
                        <p className="text-xs text-slate-500">{clubInfo.tagline}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Established in {clubInfo.established}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Institution
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{clubInfo.college}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Club Email
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-800">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{clubInfo.email}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Official Website
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-emerald-700">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <a href={clubInfo.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                            {clubInfo.website}
                          </a>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Established Year
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{clubInfo.established}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">
                        Mission Statement
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {clubInfo.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. ACCOUNT SETTINGS */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account Details */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-serif">
                      Account Profile
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Logged-in administrator credentials and role assignment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Display Name
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block">
                        {user?.name || 'Admin User'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Email Address
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                        {user?.email || 'admin@verve.com'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Assigned Role
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
                          Read-Only
                        </span>
                      </div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                        {user?.role || 'ADMIN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-serif">
                      Change Password
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ensure your account uses a strong, secure passphrase.
                    </p>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter your current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:max-w-md">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          New Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="At least 6 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm New Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Re-type new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-serif">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure which events trigger alerts within the dashboard.
                  </p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-4 pt-1 divide-y divide-slate-100">
                  {/* Task Assignments */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Task Assignments
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Notify when you or team members are assigned new tasks.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.taskAssignments}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            taskAssignments: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  {/* Deadline Reminders */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Deadline Reminders
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Receive upcoming deadline alerts for project deliverables.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.deadlineReminders}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            deadlineReminders: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  {/* Project Updates */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Project Updates
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Get notified when project milestones or statuses change.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.projectUpdates}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            projectUpdates: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  {/* Team Changes */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Team Changes
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Alerts when members join teams or leadership roles update.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.teamChanges}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            teamChanges: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  {/* System Announcements */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        System Announcements
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Important administrative broadcast notices and release notes.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.systemAnnouncements}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            systemAnnouncements: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 5. PRIVACY & SECURITY */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-serif">
                    Privacy & Security
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Account protection, session credentials, and cryptographic integrity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>Role & Privileges</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Your account holds <span className="font-semibold text-slate-700">{user?.role || 'ADMIN'}</span> status, granting access to members, tasks, and system data.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>Password Security</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Passwords are salt-hashed using <span className="font-semibold text-slate-700">bcrypt (10 rounds)</span>. Plaintext hashes are never transmitted or logged.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>JWT Authentication</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sessions are verified via signed JSON Web Tokens over secure bearer authorization headers.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Active Session</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Current login active. Last refreshed <span className="font-semibold text-slate-700">Today</span>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    All administrative actions are continuously logged in the system activity audit trail.
                  </p>
                </div>
              </div>
            )}

            {/* 6. INTEGRATIONS */}
            {activeTab === 'integrations' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-serif">
                    Integrations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informational overview of supported developer and productivity integrations.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* GitHub */}
                  <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <GitBranch className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">GitHub</h4>
                        <p className="text-[11px] text-slate-500">
                          Link club repositories to display code commits and issues.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      Informational
                    </span>
                  </div>

                  {/* Google Calendar */}
                  <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Google Calendar</h4>
                        <p className="text-[11px] text-slate-500">
                          Sync club deadlines and event agendas to shared calendars.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      Informational
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed">
                  Third-party connectors are configured as informational modules in this version. No external tokens or OAuth redirects are initiated.
                </div>
              </div>
            )}

            {/* 7. DATA MANAGEMENT */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                {/* Database Statistics */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-serif">
                      Database Statistics
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time entity counts persisted in the Supabase database.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-xl font-bold text-slate-900">{dataStats.members}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">Members</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-xl font-bold text-slate-900">{dataStats.projects}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">Projects</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-xl font-bold text-slate-900">{dataStats.teams}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">Teams</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-xl font-bold text-slate-900">{dataStats.tasks}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">Tasks</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center col-span-2 sm:col-span-1">
                      <div className="text-xl font-bold text-slate-900">{dataStats.activities}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">Activities</div>
                    </div>
                  </div>
                </div>

                {/* Export Data */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-serif">
                      Export Club Data
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Generate and download a complete JSON snapshot of club entities. Passwords, hashes, and secret keys are strictly stripped for data privacy.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-5 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Clean Club Export</span>
                    </button>
                  </div>
                </div>

                {/* Danger Zone: Informational / Disabled */}
                <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-7 border border-rose-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-rose-700 tracking-wide uppercase">
                      Danger Zone
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Permanent club data deletion is disabled in this version.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Club records and student membership activity are retained for institutional accreditation and audit requirements.
                  </p>
                </div>
              </div>
            )}

            {/* 8. ABOUT */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-[#1e3a2f] text-white font-bold text-xl flex items-center justify-center shadow-xs">
                    V
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-serif">Verve</h2>
                    <p className="text-xs text-slate-500">Club Management System</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Version 1.0.0
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  <p>
                    Verve is a unified, light-themed club management suite designed to empower student leaders and organizations. It provides end-to-end capabilities for member rosters, project milestone tracking, task coordination, and activity logs.
                  </p>
                  <p>
                    Built with modern web standards, light aesthetics, and reliable relational persistence.
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  © 2026 Verve Club Management. All rights reserved.
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Shown in 'general' view to match the primary visual reference screenshot */}
          {activeTab === 'general' && (
            <div className="lg:col-span-4 space-y-6">
              {/* Club Information Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                    Club Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setClubForm({ ...clubInfo });
                      setActiveTab('club');
                      setIsEditingClub(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-12 h-12 rounded-full bg-[#1e3a2f] text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {clubInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{clubInfo.name}</h4>
                    <p className="text-[11px] text-slate-500">{clubInfo.tagline}</p>
                    <p className="text-[10px] text-slate-400">Established {clubInfo.established}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{clubInfo.college}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{clubInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={clubInfo.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline truncate"
                    >
                      {clubInfo.website}
                    </a>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {clubInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                  Quick Actions
                </h3>

                <div className="space-y-2">
                  {/* Export Club Data */}
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Export Club Data</div>
                        <div className="text-[10px] text-slate-400">Download clean club data</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Reset Preferences */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({
                        language: 'en-US',
                        dateFormat: 'MMM D, YYYY',
                        timeFormat: '12h',
                        defaultView: 'Dashboard',
                      });
                      showToast('Preferences restored to default!');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Reset Preferences</div>
                        <div className="text-[10px] text-slate-400">Restore default settings</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Manage Roles */}
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('Members')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <UsersRound className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Manage Roles</div>
                        <div className="text-[10px] text-slate-400">View and edit member roles</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* System Logs */}
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('Activity')}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <FileCode className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">System Logs</div>
                        <div className="text-[10px] text-slate-400">View recent system activity</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Danger Zone: Informational / Disabled */}
              <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-7 border border-rose-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-rose-700 tracking-wide">Danger Zone</h3>

                <button
                  type="button"
                  onClick={() => setShowDangerNotice(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-rose-100/50 transition-colors text-left group border border-rose-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-rose-700">Delete Club Data</div>
                      <div className="text-[10px] text-rose-500">Permanently delete all data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Danger Zone Disabled Notice Modal */}
      {showDangerNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200/80 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Disabled in this version</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Permanent club data deletion is disabled in this version.
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Club records are preserved for institutional audit integrity.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDangerNotice(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
