import React, { useState, useEffect, useMemo } from 'react';
import ProjectLeadNavbar from '../../components/ProjectLeadNavbar';
import ProjectLeadSidebar from '../../components/ProjectLeadSidebar';
import { leadAPI } from '../../services/api';
import {
  Search,
  Users,
  CheckSquare,
  Mail,
  Briefcase,
  Layers,
  ArrowRight,
  Plus,
  X,
  Check,
} from 'lucide-react';

const LeadTeam = ({ onNavigate, onAssignTaskToMember }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Task Creation Modal from Team Page
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getTeams();
      if (res.success) {
        setTeams(res.teams || []);
        setMembers(res.members || []);
      }
      const optRes = await leadAPI.getTaskOptions();
      if (optRes.success) {
        setTaskOptions(optRes);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

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

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q))
      );
    });
  }, [members, searchQuery]);

  const handleOpenAssignModal = (member) => {
    setTargetMember(member);
    setTaskForm({
      title: '',
      description: '',
      project_id: taskOptions.projects[0]?.id || '',
      assigned_to: member.id,
      priority: 'MEDIUM',
      status: 'TODO',
      deadline: '',
    });
    setFormError('');
    setIsTaskModalOpen(true);
  };

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
      setSubmitting(true);
      setFormError('');
      const res = await leadAPI.createTask({
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        deadline: taskForm.deadline || null,
      });
      if (res.success) {
        setIsTaskModalOpen(false);
        showToast(`Task assigned to ${targetMember?.name || 'member'} successfully!`);
        fetchTeamData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to assign task');
    } finally {
      setSubmitting(false);
    }
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
        activePage="My Team"
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
              My Team
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Members collaborating on your projects. Monitor task workloads and progress.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
          </div>
        </div>

        {/* Teams Overview Pills */}
        {teams.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Your Teams:</span>
            {teams.map((t) => (
              <div
                key={t.id}
                className="px-3 py-1 rounded-xl bg-white border border-slate-200/70 text-xs text-slate-700 font-medium flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Users className="w-3 h-3 text-emerald-600" />
                <span className="font-semibold text-slate-900">{t.name}</span>
                <span className="text-[10px] text-slate-400">({t.memberCount} members)</span>
              </div>
            ))}
          </div>
        )}

        {/* Member Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading team members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-slate-200/80 text-center p-8 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No team members found</p>
            <p className="text-xs text-slate-400">No members match your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5">
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      member.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'PROJECT_LEAD'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                {/* Info & Tasks Progress */}
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400 font-medium">Department</span>
                    <span className="font-semibold text-slate-800">{member.department || 'Club Member'}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Project Tasks Progress</span>
                      <span className="font-bold text-slate-800">
                        {member.completedTasksCount || 0} / {member.assignedTasksCount || 0} ({member.progress || 0}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${member.progress || 0}%` }}
                        className="h-full rounded-full bg-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Assigned Teams */}
                  {member.teams && member.teams.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                        Assigned Teams:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.teams.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] text-slate-600 font-medium"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(member)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task to {member.name.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Assign Task to {targetMember?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select one of your managed projects and delegate the task.
                </p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
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
                  placeholder="e.g. Design responsive navbar"
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
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1e3a2f] hover:bg-[#162e25] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTeam;
