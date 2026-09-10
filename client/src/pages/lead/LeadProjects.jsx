import React, { useState, useEffect, useMemo } from 'react';
import ProjectLeadNavbar from '../../components/ProjectLeadNavbar';
import ProjectLeadSidebar from '../../components/ProjectLeadSidebar';
import { leadAPI } from '../../services/api';
import {
  Search,
  Folder,
  Calendar,
  UsersRound,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Layers,
  Check,
} from 'lucide-react';

const LeadProjects = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ all: 0, active: 0, completed: 0, onHold: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, ON_HOLD, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  // Selected project for details modal
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getProjects({
        status: activeTab !== 'ALL' ? activeTab : '',
        search: searchQuery,
      });
      if (res.success) {
        setProjects(res.projects || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'ACTIVE') {
        matchesTab = p.status === 'IN_PROGRESS' || p.status === 'PLANNING';
      } else if (activeTab === 'COMPLETED') {
        matchesTab = p.status === 'COMPLETED';
      } else if (activeTab === 'ON_HOLD') {
        matchesTab = p.status === 'ON_HOLD';
      }

      return matchesSearch && matchesTab;
    });
  }, [projects, searchQuery, activeTab]);

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
        activePage="My Projects"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
              My Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Projects assigned to you as Project Lead. Track progress and oversee deliverables.
            </p>
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All Projects', count: stats.all },
              { key: 'ACTIVE', label: 'Active', count: stats.active },
              { key: 'ON_HOLD', label: 'On Hold', count: stats.onHold },
              { key: 'COMPLETED', label: 'Completed', count: stats.completed },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.key
                      ? 'bg-emerald-700/60 text-emerald-50'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-slate-200/80 text-center p-8 space-y-2">
            <Folder className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No projects found</p>
            <p className="text-xs text-slate-400">
              No assigned projects match your selected filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((proj) => {
              const isDone = proj.status === 'COMPLETED';
              const isOnHold = proj.status === 'ON_HOLD';
              const deadlineStr = proj.deadline
                ? new Date(proj.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No deadline';

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  {/* Top */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5 fill-current" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOnHold
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                        }`}
                      >
                        {isDone ? 'Completed' : isOnHold ? 'On Hold' : 'Active'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Progress & Team Details */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Task Progress</span>
                        <span className="font-bold text-slate-800">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${proj.progress}%` }}
                          className={`h-full rounded-full transition-all ${
                            isDone ? 'bg-emerald-600' : isOnHold ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due {deadlineStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {proj.completedTaskCount} / {proj.taskCount} tasks
                        </span>
                      </div>
                    </div>

                    {/* Team Members Avatars */}
                    {proj.team && proj.team.members && proj.team.members.length > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">
                          {proj.team.name}
                        </span>
                        <div className="flex items-center -space-x-1.5">
                          {proj.team.members.slice(0, 3).map((m) => (
                            <div
                              key={m.id}
                              title={`${m.name} (${m.role})`}
                              className="w-6 h-6 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                            >
                              {getInitials(m.name)}
                            </div>
                          ))}
                          {proj.team.members.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-500 pl-2">
                              +{proj.team.members.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200/80 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Folder className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {selectedProject.name}
                  </h3>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedProject.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProject.status === 'ON_HOLD'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-600 pt-2">
              {/* Description */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                  {selectedProject.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Deadline</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {selectedProject.deadline
                      ? new Date(selectedProject.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'None set'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Progress</span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                    {selectedProject.progress}%
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Tasks</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {selectedProject.completedTaskCount || 0} / {selectedProject.taskCount || 0} completed
                  </span>
                </div>
              </div>

              {/* Team Information */}
              {selectedProject.team && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Assigned Team: {selectedProject.team.name}
                  </h4>
                  {selectedProject.team.members && selectedProject.team.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProject.team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {member.role} • {member.department || 'Member'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No members assigned to this team.</p>
                  )}
                </div>
              )}

              {/* Project Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    Project Tasks ({selectedProject.tasks?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      if (onNavigate) onNavigate('Tasks');
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                  <p className="text-slate-400 italic py-3">No tasks created for this project yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedProject.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span
                            className={`font-medium truncate ${
                              t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              t.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : t.priority === 'LOW'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {t.assignee?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
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

export default LeadProjects;
