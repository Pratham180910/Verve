import React, { useState, useEffect, useMemo } from 'react';
import MemberNavbar from '../../components/MemberNavbar';
import MemberSidebar from '../../components/MemberSidebar';
import { memberDashboardAPI } from '../../services/api';
import {
  Search,
  CheckSquare,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Filter,
  Check,
  X,
  Folder,
} from 'lucide-react';

const MemberTasks = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await memberDashboardAPI.getTasks({
        search: searchQuery,
        status: selectedStatus,
        priority: selectedPriority,
      });
      if (res.success) {
        setTasks(res.tasks || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchQuery, selectedStatus, selectedPriority]);

  // Update own task status
  const handleUpdateStatus = async (task, newStatus) => {
    try {
      const res = await memberDashboardAPI.updateTaskStatus(task.id, newStatus);
      if (res.success) {
        showToast(`Task moved to ${newStatus.replace('_', ' ')}`);
        fetchTasks();
        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to update task status');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      <MemberNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />
      <MemberSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="My Tasks"
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
              My Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Deliverables assigned directly to you across all participating projects.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs text-slate-500 font-medium">Assigned to Me</div>
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
          {/* Status Filter */}
          <div className="w-full sm:w-auto min-w-[140px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Deadline</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading your tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
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
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        {/* Status Checkbox Button */}
                        <td
                          className="py-3 pl-6 pr-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
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
                            title={`Toggle: TODO → IN_PROGRESS → COMPLETED`}
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

                        {/* Project Name */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {task.project?.name || 'Project'}
                          </span>
                        </td>

                        {/* Priority */}
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

                        {/* Status Select dropdown */}
                        <td
                          className="py-3 pl-3 pr-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {selectedTask.project?.name || 'Project Deliverable'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-serif mt-1.5">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Description */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Description</span>
                <p className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed">
                  {selectedTask.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Priority</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.2 rounded-md font-bold text-[10px] ${
                      selectedTask.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedTask.priority === 'LOW'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Due Date</span>
                  <span className="text-xs font-semibold text-slate-800 mt-1 block">
                    {selectedTask.deadline
                      ? new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'None set'}
                  </span>
                </div>
              </div>

              {/* Status Update Control */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Update Your Task Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedTask, st)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedTask.status === st
                          ? 'bg-[#1e3a2f] text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTasks;
