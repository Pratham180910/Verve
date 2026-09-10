import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leadAPI } from '../services/api';
import ProjectLeadNavbar from '../components/ProjectLeadNavbar';
import ProjectLeadSidebar from '../components/ProjectLeadSidebar';
import LeadProjects from './lead/LeadProjects';
import LeadTeam from './lead/LeadTeam';
import LeadTasks from './lead/LeadTasks';
import LeadActivity from './lead/LeadActivity';
import {
  Folder,
  Users,
  CheckSquare,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';

const ProjectLeadDashboard = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine initial page from URL pathname
  const getInitialPage = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/projects')) return 'My Projects';
    if (path.includes('/team')) return 'My Team';
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/activity')) return 'Activity';
    return 'Dashboard';
  };

  const [activePage, setActivePage] = useState(getInitialPage);

  // Sync route URL with state
  const handleNavigate = (pageKey) => {
    setActivePage(pageKey);
    let targetPath = '/project-lead/dashboard';
    if (pageKey === 'My Projects') targetPath = '/project-lead/projects';
    else if (pageKey === 'My Team') targetPath = '/project-lead/team';
    else if (pageKey === 'Tasks') targetPath = '/project-lead/tasks';
    else if (pageKey === 'Activity') targetPath = '/project-lead/activity';

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

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    stats: { projectCount: 0, teamMemberCount: 0, openTasksCount: 0, completedTasksCount: 0 },
    projects: [],
    tasks: [],
    teamMembers: [],
    milestones: [],
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  // Task Creation Modal State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskOptions, setTaskOptions] = useState({ projects: [], members: [] });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    priority: 'MEDIUM',
    status: 'TODO',
    deadline: '',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Failed to load lead dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await leadAPI.getTaskOptions();
      if (res.success) {
        setTaskOptions(res);
      }
    } catch (err) {
      console.error('Failed to load task options:', err);
    }
  };

  useEffect(() => {
    if (activePage === 'Dashboard') {
      fetchDashboard();
      fetchOptions();
    }
  }, [activePage]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Status toggle handler for quick task list
  const handleToggleTaskStatus = async (task) => {
    const nextStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'TODO';
    try {
      const res = await leadAPI.updateTaskStatus(task.id, nextStatus);
      if (res.success) {
        fetchDashboard();
        showToast(`Task status moved to ${nextStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update task status');
    }
  };

  // Create Task Submit
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!taskForm.project_id) {
      setFormError('Please select an assigned project');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await leadAPI.createTask({
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        deadline: taskForm.deadline || null,
      });
      if (res.success) {
        setIsCreateTaskOpen(false);
        setTaskForm({
          title: '',
          description: '',
          project_id: taskOptions.projects[0]?.id || '',
          assigned_to: '',
          priority: 'MEDIUM',
          status: 'TODO',
          deadline: '',
        });
        showToast('Task created and assigned successfully!');
        fetchDashboard();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Route sub-views
  if (activePage === 'My Projects') {
    return <LeadProjects onNavigate={handleNavigate} />;
  }
  if (activePage === 'My Team') {
    return <LeadTeam onNavigate={handleNavigate} />;
  }
  if (activePage === 'Tasks') {
    return <LeadTasks onNavigate={handleNavigate} />;
  }
  if (activePage === 'Activity') {
    return <LeadActivity onNavigate={handleNavigate} />;
  }

  // Active view: Dashboard
  const firstName = user?.name ? user.name.split(' ')[0] : 'Lead';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Top Navbar */}
      <ProjectLeadNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Slide-out Sidebar Drawer (5 Items ONLY) */}
      <ProjectLeadSidebar
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

        {/* Welcome Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 font-serif tracking-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Let's keep your projects moving forward.
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
              “Good ideas become reality with great teams.”
            </span>
          </div>
        </section>

        {/* 4 Stat Cards Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Projects */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.projectCount}
              </div>
              <div className="text-xs font-medium text-slate-500">My Projects</div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.teamMemberCount}
              </div>
              <div className="text-xs font-medium text-slate-500">Team Members</div>
            </div>
          </div>

          {/* Open Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.openTasksCount}
              </div>
              <div className="text-xs font-medium text-slate-500">Open Tasks</div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.stats.completedTasksCount}
              </div>
              <div className="text-xs font-medium text-slate-500">Completed Tasks</div>
            </div>
          </div>
        </section>

        {/* Main Content Grid: 2 Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): My Projects & My Tasks */}
          <div className="lg:col-span-7 space-y-6">
            {/* My Projects Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
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

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading projects...</div>
              ) : dashboardData.projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No projects currently assigned to you as Project Lead.
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {dashboardData.projects.map((proj) => {
                    const isCompleted = proj.status === 'COMPLETED';
                    const isOnHold = proj.status === 'ON_HOLD';

                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleNavigate('My Projects')}
                        className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <Folder className="w-4 h-4 fill-current" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{proj.name}</h4>
                              <p className="text-[11px] text-slate-500 truncate max-w-sm">
                                {proj.description || 'Project managed by lead team.'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOnHold
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            }`}
                          >
                            {isCompleted ? 'Completed' : isOnHold ? 'On Hold' : 'Active'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex-1 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${proj.progress}%` }}
                              className={`h-full rounded-full transition-all ${
                                isOnHold ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                            {proj.progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Tasks Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">My Tasks</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskForm({
                        title: '',
                        description: '',
                        project_id: taskOptions.projects[0]?.id || '',
                        assigned_to: '',
                        priority: 'MEDIUM',
                        status: 'TODO',
                        deadline: '',
                      });
                      setFormError('');
                      setIsCreateTaskOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-[#1e3a2f] hover:bg-[#162e25] text-white text-[11px] font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('Tasks')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {dashboardData.tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No tasks currently recorded for your projects.
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
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
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
                            title="Toggle Status"
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
                              {task.project?.name} • Assigned to {task.assignee?.name || 'Unassigned'}
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
          </div>

          {/* Right Column (5 cols): My Team & Upcoming Milestones */}
          <div className="lg:col-span-5 space-y-6">
            {/* My Team Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">My Team</h3>
                <button
                  type="button"
                  onClick={() => handleNavigate('My Team')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {dashboardData.teamMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No team members added to your projects yet.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {dashboardData.teamMembers.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{member.name}</div>
                          <div className="text-[10px] text-slate-400">{member.department}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTaskForm({
                      title: '',
                      description: '',
                      project_id: taskOptions.projects[0]?.id || '',
                      assigned_to: '',
                      priority: 'MEDIUM',
                      status: 'TODO',
                      deadline: '',
                    });
                    setIsCreateTaskOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Assign Task to Member</span>
                </button>
              </div>
            </div>

            {/* Upcoming Milestones Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Upcoming Milestones</h3>
                <button
                  type="button"
                  onClick={() => handleNavigate('Tasks')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {dashboardData.milestones.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No upcoming project milestones recorded.
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {dashboardData.milestones.map((m) => {
                    const dateFormatted = new Date(m.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{m.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{dateFormatted}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Task Creation Modal */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">Create Project Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign tasks within your managed projects.</p>
              </div>
              <button
                onClick={() => setIsCreateTaskOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design homepage mockup"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={taskForm.project_id}
                  onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select an assigned project</option>
                  {taskOptions.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Unassigned</option>
                    {taskOptions.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1e3a2f] hover:bg-[#162e25] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectLeadDashboard;
