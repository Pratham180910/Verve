import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { memberDashboardAPI } from '../services/api';
import MemberNavbar from '../components/MemberNavbar';
import MemberSidebar from '../components/MemberSidebar';
import MemberTasks from './member/MemberTasks';
import MemberProjects from './member/MemberProjects';
import MemberTeam from './member/MemberTeam';
import MemberActivity from './member/MemberActivity';
import MemberProfile from './member/MemberProfile';
import {
  Folder,
  CheckSquare,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Check,
} from 'lucide-react';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine initial page from URL pathname
  const getInitialPage = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/tasks')) return 'My Tasks';
    if (path.includes('/projects')) return 'My Projects';
    if (path.includes('/team')) return 'My Team';
    if (path.includes('/activity')) return 'Activity';
    if (path.includes('/profile')) return 'Profile';
    return 'Dashboard';
  };

  const [activePage, setActivePage] = useState(getInitialPage);

  // Sync route URL with state
  const handleNavigate = (pageKey) => {
    setActivePage(pageKey);
    let targetPath = '/member/dashboard';
    if (pageKey === 'My Tasks') targetPath = '/member/tasks';
    else if (pageKey === 'My Projects') targetPath = '/member/projects';
    else if (pageKey === 'My Team') targetPath = '/member/team';
    else if (pageKey === 'Activity') targetPath = '/member/activity';
    else if (pageKey === 'Profile') targetPath = '/member/profile';

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [dashboardData, setDashboardData] = useState({
    stats: { projectCount: 0, taskCount: 0, completedCount: 0, inProgressCount: 0 },
    tasks: [],
    projects: [],
    teamMembers: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await memberDashboardAPI.getDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Failed to load member dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'Dashboard') {
      fetchDashboard();
    }
  }, [activePage]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Member status update (TODO -> IN_PROGRESS -> COMPLETED)
  const handleToggleTaskStatus = async (task) => {
    const nextStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'TODO';

    try {
      const res = await memberDashboardAPI.updateTaskStatus(task.id, nextStatus);
      if (res.success) {
        fetchDashboard();
        showToast(`Task status updated to ${nextStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update task status');
    }
  };

  // Render Sub-Views
  if (activePage === 'My Tasks') {
    return <MemberTasks onNavigate={handleNavigate} />;
  }
  if (activePage === 'My Projects') {
    return <MemberProjects onNavigate={handleNavigate} />;
  }
  if (activePage === 'My Team') {
    return <MemberTeam onNavigate={handleNavigate} />;
  }
  if (activePage === 'Activity') {
    return <MemberActivity onNavigate={handleNavigate} />;
  }
  if (activePage === 'Profile') {
    return <MemberProfile onNavigate={handleNavigate} />;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Top Navbar */}
      <MemberNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Slide-out Sidebar Drawer (6 Items ONLY) */}
      <MemberSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Dashboard"
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Welcome Section */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 font-serif tracking-tight">
              Hi, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Here are your tasks and updates for today.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-medium text-slate-400 block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs font-serif italic text-slate-500 block mt-0.5">
              “Small steps, big contributions.”
            </span>
          </div>
        </section>

        {/* Hero Architecture Banner (matching primary reference image) */}
        <section>
          <div className="relative h-[180px] sm:h-[210px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
              alt="Learn Collaborate Create Belong banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

            <div className="absolute top-6 left-8 text-white/90 font-serif text-xs sm:text-sm font-bold tracking-wider leading-snug drop-shadow-sm select-none">
              LEARN <br />
              COLLABORATE <br />
              CREATE <br />
              BELONG
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
              <p className="text-xs font-serif italic text-white/95 leading-snug">
                Be part of something bigger.
              </p>
              <div className="w-10 h-[2px] bg-emerald-400/60 mt-2.5 rounded-full" />
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.projectCount}
              </div>
              <div className="text-xs font-medium text-slate-500">My Projects</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.taskCount}
              </div>
              <div className="text-xs font-medium text-slate-500">My Tasks</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.completedCount}
              </div>
              <div className="text-xs font-medium text-slate-500">Completed</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.inProgressCount}
              </div>
              <div className="text-xs font-medium text-slate-500">In Progress</div>
            </div>
          </div>
        </section>

        {/* 3-Column Section: My Tasks (5 cols), My Projects (4 cols), Announcements (3 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: My Tasks (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">My Tasks</h3>
              <button
                type="button"
                onClick={() => handleNavigate('My Tasks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading your tasks...</div>
            ) : dashboardData.tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tasks assigned to you right now. Great job!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dashboardData.tasks.slice(0, 5).map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  const deadlineStr = task.deadline
                    ? new Date(task.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'No date';

                  return (
                    <div
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-slate-400 text-transparent'
                          }`}
                          title="Click to toggle status: TODO → IN_PROGRESS → COMPLETED"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </button>
                        <div className="truncate">
                          <span
                            className={`text-xs font-semibold block truncate ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {task.project?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-600'
                              : task.priority === 'LOW'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 w-16 text-right">
                          Due {deadlineStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: My Projects (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">My Projects</h3>
              <button
                type="button"
                onClick={() => handleNavigate('My Projects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {dashboardData.projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven't joined any project teams yet.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {dashboardData.projects.slice(0, 3).map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleNavigate('My Projects')}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{proj.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {proj.description || 'Club initiative.'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Member
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="flex-1 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${proj.progress}%` }}
                          className="h-full bg-emerald-600 rounded-full"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{proj.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Announcements (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Announcements</h3>
              <button
                type="button"
                onClick={() => handleNavigate('Activity')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              {dashboardData.announcements.map((ann) => (
                <div key={ann.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 leading-snug">
                      {ann.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{ann.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MemberDashboard;
