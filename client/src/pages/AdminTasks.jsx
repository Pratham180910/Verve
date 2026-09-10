import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { taskAPI } from '../services/api';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ListOrdered,
  Clock,
  Play,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
} from 'lucide-react';

const AdminTasks = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Options for dropdowns
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 8;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    priority: 'MEDIUM',
    status: 'TODO',
    deadline: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Options (projects and members)
  const fetchOptions = async () => {
    try {
      const res = await taskAPI.getTaskOptions();
      if (res.success) {
        setProjects(res.projects || []);
        setMembers(res.members || []);
      }
    } catch (err) {
      console.error('Failed to load task options:', err);
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        projectId: selectedProject,
        status: selectedStatus,
        priority: selectedPriority,
        assigneeId: selectedAssignee,
        page: currentPage,
        limit: tasksPerPage,
      };
      const res = await taskAPI.getTasks(params);
      if (res.success) {
        setTasks(res.tasks || []);
        setTotalCount(res.totalCount || 0);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [searchQuery, selectedProject, selectedStatus, selectedPriority, selectedAssignee, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedProject('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedAssignee('ALL');
    setCurrentPage(1);
  };

  // Avatar Initials & Color Helper
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = '') => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Format deadline date
  const formatDeadline = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Form Submit: Create Task
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formData.project_id) {
      setFormError('Please select a project');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await taskAPI.createTask({
        ...formData,
        assigned_to: formData.assigned_to || null,
        deadline: formData.deadline || null,
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          project_id: '',
          assigned_to: '',
          priority: 'MEDIUM',
          status: 'TODO',
          deadline: '',
        });
        await fetchTasks();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Form Submit: Edit Task
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formData.project_id) {
      setFormError('Please select a project');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await taskAPI.updateTask(editingTask.id, {
        ...formData,
        assigned_to: formData.assigned_to || null,
        deadline: formData.deadline || null,
      });
      if (res.success) {
        setEditingTask(null);
        await fetchTasks();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Toggle / Update
  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await taskAPI.updateTaskStatus(task.id, newStatus);
      if (res.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Delete Task
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      const res = await taskAPI.deleteTask(taskToDelete.id);
      if (res.success) {
        setTaskToDelete(null);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id || (task.project ? task.project.id : ''),
      assigned_to: task.assigned_to || (task.assignee ? task.assignee.id : ''),
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      deadline: task.deadline ? task.deadline.substring(0, 10) : '',
    });
    setFormError('');
  };

  const totalPages = Math.ceil(totalCount / tasksPerPage) || 1;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Tasks"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-4 pr-0 lg:pr-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              TASK MANAGEMENT
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.1] font-serif">
              Get things done.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Create, assign, and track tasks across all projects.
            </p>
          </div>

          {/* Architectural Banner */}
          <div className="lg:col-span-6">
            <div className="relative h-[210px] sm:h-[240px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="Ideas Plans Actions Results banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

              <div className="absolute top-6 left-8 text-white/90 font-serif text-sm sm:text-base font-bold tracking-wider leading-snug drop-shadow-sm select-none">
                IDEAS <br />
                PLANS <br />
                ACTIONS <br />
                RESULTS
              </div>

              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
                <p className="text-xs sm:text-sm font-serif italic text-white/95 leading-snug">
                  Small tasks make big progress.
                </p>
                <div className="w-12 h-[2px] bg-emerald-400/60 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Statistics & Create Action Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {/* Total Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ListOrdered className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs font-medium text-slate-500">Total Tasks</div>
            </div>
          </div>

          {/* To Do */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.todo}</div>
              <div className="text-xs font-medium text-slate-500">To Do</div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
              <div className="text-xs font-medium text-slate-500">In Progress</div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
              <div className="text-xs font-medium text-slate-500">Completed</div>
            </div>
          </div>

          {/* Create Task Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  project_id: projects.length > 0 ? projects[0].id : '',
                  assigned_to: '',
                  priority: 'MEDIUM',
                  status: 'TODO',
                  deadline: '',
                });
                setFormError('');
                setIsCreateModalOpen(true);
              }}
              className="w-full h-full min-h-[58px] bg-[#1e3a2f] hover:bg-[#162e25] text-white font-medium text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer px-4 py-3"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Project Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3.5 pr-8 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3.5 pr-8 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3.5 pr-8 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Assignee Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedAssignee}
              onChange={(e) => {
                setSelectedAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3.5 pr-8 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Assignees</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            Clear
          </button>
        </section>

        {/* Tasks Table */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#fbfcfd] text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-3.5 pl-6 pr-3 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-medium">Task Name</th>
                  <th className="py-3.5 px-4 font-medium">Project</th>
                  <th className="py-3.5 px-4 font-medium">Assignee</th>
                  <th className="py-3.5 px-4 font-medium">Priority</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Deadline</th>
                  <th className="py-3.5 pr-6 pl-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, index) => {
                    const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
                    const assigneeName = task.assignee?.name || 'Unassigned';
                    const projectName = task.project?.name || '—';

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-4 pl-6 pr-3 text-slate-400 text-center font-medium">
                          {rowNumber}
                        </td>

                        {/* Task Name */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs mt-0.5">
                              {task.description}
                            </span>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {projectName}
                        </td>

                        {/* Assignee */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(
                                assigneeName
                              )}`}
                            >
                              {getInitials(assigneeName)}
                            </span>
                            <span className="text-slate-800 font-medium truncate max-w-[130px]">
                              {assigneeName}
                            </span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-4">
                          {task.priority === 'HIGH' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-rose-100 text-rose-600">
                              HIGH
                            </span>
                          )}
                          {task.priority === 'MEDIUM' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-100 text-amber-700">
                              MEDIUM
                            </span>
                          )}
                          {task.priority === 'LOW' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-700">
                              LOW
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            title="Click to toggle status"
                            onClick={() => {
                              const nextStatus =
                                task.status === 'TODO'
                                  ? 'IN_PROGRESS'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'COMPLETED'
                                  : 'TODO';
                              handleStatusChange(task, nextStatus);
                            }}
                            className="text-left cursor-pointer group/btn"
                          >
                            {task.status === 'IN_PROGRESS' && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                IN PROGRESS
                              </span>
                            )}
                            {task.status === 'TODO' && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                TODO
                              </span>
                            )}
                            {task.status === 'COMPLETED' && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                                COMPLETED
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Deadline */}
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {formatDeadline(task.deadline)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Showing {totalCount > 0 ? (currentPage - 1) * tasksPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * tasksPerPage, totalCount)} of {totalCount} tasks
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#1e3a2f] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Create Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Create Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add a new task to track progress.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design landing page"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
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
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Additional details about the task..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1e3a2f] hover:bg-[#162e25] rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Task */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Edit Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify task parameters and assignment.</p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
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
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1e3a2f] hover:bg-[#162e25] rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Task Confirmation */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200/80 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Delete Task</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
