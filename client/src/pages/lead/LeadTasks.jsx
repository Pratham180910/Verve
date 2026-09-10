import React, { useState, useEffect, useMemo } from 'react';
import ProjectLeadNavbar from '../../components/ProjectLeadNavbar';
import ProjectLeadSidebar from '../../components/ProjectLeadSidebar';
import { leadAPI } from '../../services/api';
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
  Filter,
  CheckSquare,
} from 'lucide-react';

const LeadTasks = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Options
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

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
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchOptions = async () => {
    try {
      const res = await leadAPI.getTaskOptions();
      if (res.success) {
        setProjects(res.projects || []);
        setMembers(res.members || []);
      }
    } catch (err) {
      console.error('Failed to load task options:', err);
    }
  };

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
      const res = await leadAPI.getTasks(params);
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

  const totalPages = Math.ceil(totalCount / tasksPerPage) || 1;

  // Handle Quick Status Change
  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await leadAPI.updateTaskStatus(task.id, newStatus);
      if (res.success) {
        showToast(`Task moved to ${newStatus.replace('_', ' ')}`);
        fetchTasks();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      project_id: projects[0]?.id || '',
      assigned_to: '',
      priority: 'MEDIUM',
      status: 'TODO',
      deadline: '',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
    });
    setFormError('');
  };

  // Submit Create or Edit
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formData.project_id) {
      setFormError('Project selection is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        project_id: formData.project_id,
        assigned_to: formData.assigned_to || null,
        priority: formData.priority,
        status: formData.status,
        deadline: formData.deadline || null,
      };

      if (editingTask) {
        const res = await leadAPI.updateTask(editingTask.id, payload);
        if (res.success) {
          setEditingTask(null);
          showToast('Task updated successfully');
          fetchTasks();
        }
      } else {
        const res = await leadAPI.createTask(payload);
        if (res.success) {
          setIsCreateModalOpen(false);
          showToast('Task created and assigned successfully');
          fetchTasks();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error saving task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setFormSubmitting(true);
      const res = await leadAPI.deleteTask(taskToDelete.id);
      if (res.success) {
        setTaskToDelete(null);
        showToast('Task deleted successfully');
        fetchTasks();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
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
        activePage="Tasks"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
              Project Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create, assign, and track tasks for your managed projects.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e3a2f] hover:bg-[#162e25] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs text-slate-500 font-medium">Total Tasks</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.todo}</div>
              <div className="text-xs text-slate-500 font-medium">To Do</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.inProgress}</div>
              <div className="text-xs text-slate-500 font-medium">In Progress</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.completed}</div>
              <div className="text-xs text-slate-500 font-medium">Completed</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div className="w-full sm:w-auto flex-1 min-w-[160px]">
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Assigned Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full sm:w-auto min-w-[120px]">
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="w-full sm:w-auto min-w-[150px]">
            <select
              value={selectedAssignee}
              onChange={(e) => {
                setSelectedAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6 pr-3 w-12 text-center">Status</th>
                  <th className="py-3.5 px-3">Task Details</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Assignee</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Deadline</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const isDone = task.status === 'COMPLETED';
                    const deadlineFormatted = task.deadline
                      ? new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Status Toggle Checkmark */}
                        <td className="py-3 pl-6 pr-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                task,
                                task.status === 'TODO'
                                  ? 'IN_PROGRESS'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'COMPLETED'
                                  : 'TODO'
                              )
                            }
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-slate-400 text-transparent'
                            }`}
                            title={`Click to cycle status (Current: ${task.status})`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3 px-3 min-w-[220px]">
                          <span
                            className={`font-semibold text-slate-900 block truncate ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                              {task.description}
                            </span>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {task.project?.name || 'Project'}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                {getInitials(task.assignee.name)}
                              </div>
                              <span className="font-medium text-slate-700">
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Priority Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              task.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : task.priority === 'LOW'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* Deadline */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                          {deadlineFormatted}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * tasksPerPage + 1} -{' '}
                {Math.min(currentPage * tasksPerPage, totalCount)} of {totalCount} tasks
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-semibold text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {editingTask ? 'Edit Task' : 'Create Project Task'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTask ? 'Modify details of this task.' : 'Assign deliverables within your projects.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTask(null);
                }}
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

            <form onSubmit={handleSubmitTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user flow"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task instructions or requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project *</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select an assigned project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-[#1e3a2f] hover:bg-[#162e25] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingTask
                    ? 'Save Changes'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Task?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteTask}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTasks;
