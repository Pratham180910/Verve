import React, { useState, useEffect, useMemo } from 'react';
import ProjectLeadNavbar from '../../components/ProjectLeadNavbar';
import ProjectLeadSidebar from '../../components/ProjectLeadSidebar';
import { leadAPI } from '../../services/api';
import {
  BarChart2,
  Folder,
  CheckCircle2,
  Calendar,
  Users,
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

const LeadActivity = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    activeMembers: 0,
    projectsUpdated: 0,
    tasksUpdated: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dateRange, setDateRange] = useState('7'); // '7' | '30' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getActivities({
        category: activeCategory,
        days: dateRange,
        search: searchQuery,
      });
      if (res.success) {
        setActivities(res.activities || []);
        if (res.stats) setStats(res.stats);
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

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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
      const actDateZero = new Date(actDate);
      actDateZero.setHours(0, 0, 0, 0);

      if (actDateZero.getTime() === today.getTime()) {
        groups.Today.push(act);
      } else if (actDateZero.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(act);
      } else {
        groups.Earlier.push(act);
      }
    });

    return groups;
  }, [activities]);

  const getActionBadge = (action = '') => {
    if (action.includes('CREATE_TASK')) {
      return {
        label: 'Task Created',
        icon: Plus,
        bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      };
    }
    if (action.includes('COMPLETE_TASK')) {
      return {
        label: 'Completed',
        icon: CheckCircle2,
        bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (action.includes('DELETE_TASK')) {
      return {
        label: 'Task Deleted',
        icon: Trash2,
        bgColor: 'bg-rose-50 text-rose-700 border-rose-200/80',
      };
    }
    if (action.includes('TASK')) {
      return {
        label: 'Task Updated',
        icon: CheckSquare,
        bgColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      };
    }
    if (action.includes('PROJECT')) {
      return {
        label: 'Project Updated',
        icon: Folder,
        bgColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      };
    }
    if (action.includes('TEAM')) {
      return {
        label: 'Team Activity',
        icon: Users,
        bgColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
      };
    }
    return {
      label: 'Activity',
      icon: Clock,
      bgColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      <ProjectLeadNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />
      <ProjectLeadSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Activity"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
              Project Activity
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Actions, task progressions, and milestones in your assigned projects.
            </p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.totalActivities}
              </div>
              <div className="text-xs text-slate-500 font-medium">Project Activities</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.activeMembers}
              </div>
              <div className="text-xs text-slate-500 font-medium">Active Members</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.projectsUpdated}
              </div>
              <div className="text-xs text-slate-500 font-medium">Projects Involved</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.tasksUpdated}
              </div>
              <div className="text-xs text-slate-500 font-medium">Task Events</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All Activity' },
              { key: 'TASKS', label: 'Tasks' },
              { key: 'PROJECTS', label: 'Projects' },
              { key: 'TEAM', label: 'Team' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="ALL">All time</option>
            </select>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchActivities();
              }}
              className="relative"
            >
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 pl-9 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </form>
          </div>
        </div>

        {/* Activity Timeline List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent activity recorded for your assigned projects.
            </div>
          ) : (
            ['Today', 'Yesterday', 'Earlier'].map((groupTitle) => {
              const list = groupedActivities[groupTitle];
              if (!list || list.length === 0) return null;

              return (
                <div key={groupTitle} className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    {groupTitle}
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {list.map((act) => {
                      const badge = getActionBadge(act.action);
                      const Icon = badge.icon;
                      const timeStr = new Date(act.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                      const dateStr = new Date(act.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <div
                          key={act.id}
                          className="py-3 px-2 flex items-start justify-between gap-3 hover:bg-slate-50/50 rounded-xl transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              {getInitials(act.user?.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  {act.user?.name || 'Lead Team'}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${badge.bgColor}`}
                                >
                                  <Icon className="w-2.5 h-2.5" />
                                  <span>{badge.label}</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {act.description}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
                            {groupTitle === 'Earlier' ? `${dateStr} ${timeStr}` : timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default LeadActivity;
