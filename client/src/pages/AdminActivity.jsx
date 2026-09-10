import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { activityAPI } from '../services/api';
import {
  Activity as ActivityIcon,
  Users,
  Folder,
  CheckCircle2,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Trash2,
  UsersRound,
  ArrowRight,
  Star,
  Award,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

const AdminActivity = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    activeMembers: 0,
    projectsUpdated: 0,
    tasksUpdated: 0,
  });
  const [chartOverview, setChartOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dateRange, setDateRange] = useState('7'); // '7' | '30' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activityAPI.getActivities({
        category: activeCategory,
        days: dateRange,
        search: searchQuery,
      });
      if (res.success) {
        setActivities(res.activities || []);
        if (res.stats) setStats(res.stats);
        if (res.chartOverview) setChartOverview(res.chartOverview);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeCategory, dateRange]);

  // Group activities into Today, Yesterday, Earlier
  const groupedActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    activities.forEach((act) => {
      const actDate = new Date(act.created_at || Date.now());
      actDate.setHours(0, 0, 0, 0);

      if (actDate.getTime() === today.getTime()) {
        groups.Today.push(act);
      } else if (actDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(act);
      } else {
        groups.Earlier.push(act);
      }
    });

    return groups;
  }, [activities]);

  // Format time (e.g. 10:24 AM)
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Avatar Initials
  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Category & Action Styling Helper
  const getActionConfig = (action = '', description = '') => {
    const actUpper = action.toUpperCase();

    if (actUpper.includes('CREATE') && (actUpper.includes('TASK') || actUpper.includes('PROJECT'))) {
      return {
        icon: Plus,
        iconBg: 'bg-emerald-100 text-emerald-600',
        badgeText: actUpper.includes('PROJECT') ? 'Project' : 'Task',
        badgeBg: actUpper.includes('PROJECT') ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
      };
    }
    if (actUpper.includes('COMPLETE')) {
      return {
        icon: CheckCircle2,
        iconBg: 'bg-blue-100 text-blue-600',
        badgeText: 'Task',
        badgeBg: 'bg-emerald-50 text-emerald-700',
      };
    }
    if (actUpper.includes('TEAM') || actUpper.includes('MEMBER')) {
      return {
        icon: Users,
        iconBg: 'bg-teal-100 text-teal-600',
        badgeText: actUpper.includes('TEAM') ? 'Team' : 'Member',
        badgeBg: actUpper.includes('TEAM') ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700',
      };
    }
    if (actUpper.includes('PROJECT')) {
      return {
        icon: Folder,
        iconBg: 'bg-blue-100 text-blue-600',
        badgeText: 'Project',
        badgeBg: 'bg-amber-50 text-amber-700',
      };
    }
    if (actUpper.includes('UPDATE')) {
      return {
        icon: Edit2,
        iconBg: 'bg-amber-100 text-amber-600',
        badgeText: 'Task',
        badgeBg: 'bg-emerald-50 text-emerald-700',
      };
    }
    return {
      icon: ActivityIcon,
      iconBg: 'bg-slate-100 text-slate-600',
      badgeText: 'System',
      badgeBg: 'bg-slate-100 text-slate-700',
    };
  };

  // Extract quoted subtitle if any
  const parseDescription = (desc = '') => {
    const quoteMatch = desc.match(/"([^"]+)"/);
    if (quoteMatch) {
      return {
        main: desc.replace(`"${quoteMatch[1]}"`, '').trim(),
        sub: `"${quoteMatch[1]}"`,
      };
    }
    return { main: desc, sub: '' };
  };

  const categories = [
    { id: 'ALL', label: 'All Activities' },
    { id: 'PROJECT', label: 'Project Updates' },
    { id: 'TASK', label: 'Task Updates' },
    { id: 'TEAM', label: 'Team Changes' },
    { id: 'MEMBER', label: 'Member Activity' },
    { id: 'SYSTEM', label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Activity"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-4 pr-0 lg:pr-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              ACTIVITY
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.1] font-serif">
              Stay in the loop.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Track all the important updates, actions, and progress across your club in one place.
            </p>
          </div>

          {/* Architectural Banner */}
          <div className="lg:col-span-6">
            <div className="relative h-[210px] sm:h-[240px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="Same People Bigger Possibilities banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

              <div className="absolute top-6 left-8 text-white/90 font-serif text-sm sm:text-base font-bold tracking-wider leading-snug drop-shadow-sm select-none">
                SAME <br />
                PEOPLE <br />
                BIGGER <br />
                POSSIBILITIES
              </div>

              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
                <p className="text-xs sm:text-sm font-serif italic text-white/95 leading-snug">
                  Small steps. <br />
                  Big progress.
                </p>
                <div className="w-12 h-[2px] bg-emerald-400/60 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Activities */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <ActivityIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalActivities || 42}</div>
                <div className="text-xs font-medium text-slate-500">Total Activities</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ↑ 12% <span className="font-normal text-[10px] text-emerald-600 hidden sm:inline">this week</span>
            </span>
          </div>

          {/* Active Members */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.activeMembers || 8}</div>
                <div className="text-xs font-medium text-slate-500">Active Members</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ↑ 2% <span className="font-normal text-[10px] text-emerald-600 hidden sm:inline">this week</span>
            </span>
          </div>

          {/* Projects Updated */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.projectsUpdated || 6}</div>
                <div className="text-xs font-medium text-slate-500">Projects Updated</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ↑ 20% <span className="font-normal text-[10px] text-emerald-600 hidden sm:inline">this week</span>
            </span>
          </div>

          {/* Tasks Updated */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.tasksUpdated || 18}</div>
                <div className="text-xs font-medium text-slate-500">Tasks Updated</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ↑ 35% <span className="font-normal text-[10px] text-emerald-600 hidden sm:inline">this week</span>
            </span>
          </div>
        </section>

        {/* Filter Tabs & Controls */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#1e3a2f] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Date Range & Filter Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Date Range:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="ALL">All time</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchActivities}
              className="p-2 bg-white border border-slate-200/80 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Main 2-Column Content: Timeline (Left) & Overview/Highlights (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Timeline List */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
                No activity records found for this category.
              </div>
            ) : (
              ['Today', 'Yesterday', 'Earlier'].map((groupKey) => {
                const groupItems = groupedActivities[groupKey];
                if (!groupItems || groupItems.length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase px-1">
                      {groupKey}
                    </h3>

                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
                      {groupItems.map((act) => {
                        const userName = act.user?.name || 'Admin User';
                        const timeStr = formatTime(act.created_at);
                        const { icon: ActionIcon, iconBg, badgeText, badgeBg } = getActionConfig(
                          act.action,
                          act.description
                        );
                        const { main: descMain, sub: descSub } = parseDescription(act.description);
                        const projectName = act.project?.name || (act.project_id ? 'Project' : null);

                        return (
                          <div
                            key={act.id}
                            className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            {/* Left: Time, Action Icon, Avatar, Arrow, User & Action Text */}
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              {/* Time */}
                              <span className="text-[11px] font-medium text-slate-400 w-16 shrink-0">
                                {timeStr}
                              </span>

                              {/* Action Circle Icon */}
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
                              >
                                <ActionIcon className="w-3.5 h-3.5" />
                              </div>

                              {/* User Avatar */}
                              <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                                {getInitials(userName)}
                              </div>

                              {/* Arrow */}
                              <span className="text-slate-300 text-xs hidden sm:inline">→</span>

                              {/* Action and description */}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {descMain.startsWith(userName) ? descMain : `${userName} ${descMain}`}
                                </div>
                                {descSub && (
                                  <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                                    {descSub}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Badges for Category and Target Entity */}
                            <div className="flex items-center gap-2 shrink-0 pl-16 sm:pl-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${badgeBg}`}
                              >
                                {badgeText}
                              </span>

                              {projectName && (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  {projectName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Overview Card & Highlights Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Activity Overview (Chart) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <h4 className="text-xs font-bold text-slate-900 tracking-wide">
                    Activity Overview
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Last 7 days</span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="pt-2 pb-1">
                <div className="h-32 flex items-end justify-between gap-2 px-1">
                  {(chartOverview.length > 0
                    ? chartOverview
                    : [
                        { label: 'Aug 28', count: 2 },
                        { label: 'Aug 29', count: 6 },
                        { label: 'Aug 30', count: 8 },
                        { label: 'Aug 31', count: 5 },
                        { label: 'Sep 1', count: 9 },
                        { label: 'Sep 2', count: 11 },
                        { label: 'Sep 3', count: 15 },
                      ]
                  ).map((bar, idx) => {
                    const isLast = idx === (chartOverview.length || 7) - 1;
                    const maxVal = 15;
                    const heightPercent = Math.max(15, Math.min(100, ((bar.count || 2) / maxVal) * 100));

                    return (
                      <div key={bar.label + idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[9px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.count || 0}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isLast ? 'bg-[#1e3a2f]' : 'bg-emerald-100 hover:bg-emerald-200'
                          }`}
                        />
                        <span className="text-[9px] text-slate-400 font-medium truncate max-w-[36px] text-center">
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend counts */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Projects
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{stats.projectsUpdated || 6}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Tasks
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{stats.tasksUpdated || 18}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Teams
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">8</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Members
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{stats.activeMembers || 10}</div>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Highlights */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <h4 className="text-xs font-bold text-slate-900 tracking-wide">Recent Highlights</h4>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Hackathon 2026 moved to <span className="underline decoration-amber-400">In Progress</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">2 hours ago</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      5 new members joined this week
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">5 hours ago</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      18 tasks completed this week
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">1 day ago</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      3 new projects created
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">2 days ago</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('ALL');
                    setDateRange('ALL');
                  }}
                  className="w-full py-2.5 bg-[#f3f9f5] hover:bg-[#e6f4ec] text-[#1e3a2f] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View All Activities</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminActivity;
