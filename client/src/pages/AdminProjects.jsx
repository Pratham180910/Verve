import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { projectAPI } from '../services/api';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  UsersRound,
  CheckSquare,
  Leaf,
  X,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

const AdminProjects = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    completed: 0,
    onHold: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, COMPLETED, ON_HOLD
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, progress, deadline
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Action Menu & Modal States
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    status: 'PLANNING',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Projects from Supabase via backend API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getProjects({
        search: searchQuery,
        status: activeTab !== 'ALL' ? activeTab : '',
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

  // Client-side search and sorting
  const displayedProjects = useMemo(() => {
    let list = projects.filter((p) => {
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

    if (sortBy === 'progress') {
      list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else if (sortBy === 'deadline') {
      list.sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [projects, searchQuery, activeTab, sortBy]);

  // Handle Create Project
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Project name is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await projectAPI.createProject(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        setFormData({ name: '', description: '', deadline: '', status: 'PLANNING' });
        await fetchProjects();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit Project
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Project name is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      const res = await projectAPI.updateProject(editingProject.id, formData);
      if (res.success) {
        setEditingProject(null);
        await fetchProjects();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update project');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Quick Status Change
  const handleQuickStatusChange = async (projectId, newStatus) => {
    try {
      await projectAPI.updateProject(projectId, { status: newStatus });
      setActiveMenuId(null);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Handle Delete Project
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await projectAPI.deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const openEditModal = (p) => {
    setEditingProject(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      deadline: p.deadline ? p.deadline.split('T')[0] : '',
      status: p.status || 'PLANNING',
    });
    setFormError('');
    setActiveMenuId(null);
  };

  // Format deadline string
  const formatDeadline = (deadline, status) => {
    if (status === 'COMPLETED') {
      if (!deadline) return 'Completed';
      const d = new Date(deadline);
      return `Completed ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (!deadline) return 'No due date';
    const d = new Date(deadline);
    return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
            In Progress
          </span>
        );
      case 'PLANNING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
            Active
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 shadow-xs">
            On Hold
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Top Navbar */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={onNavigate}
      />

      {/* Navigation Drawer */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Projects"
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Title, Subtitle, Motto */}
          <div className="lg:col-span-6 space-y-4 pr-0 lg:pr-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              PROJECTS
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.1] font-serif">
              Turn ideas <br className="hidden sm:inline" />
              into impact.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Create and manage club projects. Set goals, track progress, and bring your ideas to
              life together.
            </p>

            <div className="pt-2">
              <p className="text-base sm:text-lg font-serif italic text-slate-700">
                “Ideas are only the beginning.”
              </p>
              <div className="w-16 h-[2px] bg-slate-300 mt-1.5 rounded-full" />
            </div>
          </div>

          {/* Right Column: Architectural Hero Card */}
          <div className="lg:col-span-6">
            <div className="relative h-[210px] sm:h-[240px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="Students, Ideas, Community, Change banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

              {/* Architectural Typography in Image */}
              <div className="absolute top-6 left-8 text-white/90 font-serif text-sm sm:text-base font-bold tracking-wider leading-snug drop-shadow-sm select-none">
                STUDENTS <br />
                IDEAS <br />
                COMMUNITY <br />
                CHANGE
              </div>

              {/* Floating Dark Green Motto Card */}
              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
                <Leaf className="w-5 h-5 text-emerald-400 mb-2 stroke-[1.75]" />
                <p className="text-xs sm:text-sm font-semibold text-white/95 leading-snug">
                  Projects today. <br />
                  A better tomorrow.
                </p>
                <div className="w-12 h-[2px] bg-emerald-400/60 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Control Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-[#162e25] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>All Projects</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#162e25] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>Active</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.active}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'COMPLETED'
                  ? 'bg-[#162e25] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>Completed</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.completed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ON_HOLD')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'ON_HOLD'
                  ? 'bg-[#162e25] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>On Hold</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'ON_HOLD' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.onHold}
              </span>
            </button>
          </div>

          {/* Search, Filter & Action Button */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-xs rounded-xl border border-slate-200/80 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 transition-colors"
                title="Sort and filter"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>

              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sort By
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('newest');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                        sortBy === 'newest' ? 'font-bold text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <span>Newest First</span>
                      {sortBy === 'newest' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('progress');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                        sortBy === 'progress' ? 'font-bold text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <span>Progress (High-Low)</span>
                      {sortBy === 'progress' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('deadline');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                        sortBy === 'deadline' ? 'font-bold text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <span>Deadline</span>
                      {sortBy === 'deadline' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Create Project Button */}
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', description: '', deadline: '', status: 'PLANNING' });
                setFormError('');
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#162e25] hover:bg-[#12241d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </section>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs">Loading projects from Supabase...</span>
          </div>
        ) : displayedProjects.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No projects found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No projects matched "${searchQuery}". Try changing your search or filter.`
                : 'Get started by creating your first club project.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#162e25] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#12241d] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
              >
                {/* Top Image Banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                  {/* Floating Status Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Floating Three-Dot Menu Button */}
                  <div className="absolute top-3.5 right-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(activeMenuId === project.id ? null : project.id)
                      }
                      className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-xs hover:bg-white transition-all"
                      title="Project Options"
                      aria-label="Project actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === project.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Project</span>
                          </button>

                          {/* Quick Status Submenu */}
                          <div className="border-t border-slate-100 my-1 pt-1">
                            <span className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Mark Status
                            </span>
                            {project.status !== 'IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(project.id, 'IN_PROGRESS')}
                                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>In Progress</span>
                              </button>
                            )}
                            {project.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(project.id, 'COMPLETED')}
                                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Completed</span>
                              </button>
                            )}
                            {project.status !== 'ON_HOLD' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(project.id, 'ON_HOLD')}
                                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>On Hold</span>
                              </button>
                            )}
                          </div>

                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setProjectToDelete(project);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 min-h-[2rem]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-end text-[11px] font-bold text-slate-700">
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : project.name.includes('Hackathon')
                            ? 'bg-blue-600'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Footer: Metadata */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1 text-slate-600">
                      <UsersRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.teamCount} Teams</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.taskCount} Tasks</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[110px]">
                        {formatDeadline(project.deadline, project.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Atmospheric Notes matching reference */}
        <section className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-800/40">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif italic text-xs text-slate-500">
                “Projects give people a reason to grow together.”
              </p>
              <div className="w-12 h-[1px] bg-slate-300 mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-serif italic text-slate-500">
            <span>More ideas Ahead</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </section>
      </main>

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add a new club initiative to Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the project goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all font-medium"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#162e25] hover:bg-[#12241d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setEditingProject(null)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Project</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update project information and status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all font-medium"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#162e25] hover:bg-[#12241d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setProjectToDelete(null)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 z-10 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-700">"{projectToDelete.name}"</span>? Associated
                teams and tasks will also be cleaned up.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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

export default AdminProjects;
