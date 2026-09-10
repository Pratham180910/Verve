import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { teamAPI } from '../services/api';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  UsersRound,
  Code,
  Video,
  Calendar,
  BarChart2,
  Users,
  Megaphone,
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  Layers,
} from 'lucide-react';

const AdminTeams = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    onHold: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, ON_HOLD, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Options for Dropdowns
  const [projectOptions, setProjectOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  // Create / Edit Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    projectLeadId: '',
    memberIds: [],
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Teams & Options from Supabase via backend API
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await teamAPI.getTeams({
        search: searchQuery,
        status: activeTab !== 'ALL' ? activeTab : selectedStatusFilter,
        projectId: selectedProjectFilter,
      });
      if (res.success) {
        setTeams(res.teams || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await teamAPI.getTeamOptions();
      if (res.success) {
        setProjectOptions(res.projects || []);
        setUserOptions(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load team options:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [activeTab, selectedProjectFilter, selectedStatusFilter]);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Filtered teams for display
  const displayedTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.projectName && t.projectName.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'ACTIVE') matchesTab = t.status === 'Active';
      else if (activeTab === 'ON_HOLD') matchesTab = t.status === 'On Hold';
      else if (activeTab === 'COMPLETED') matchesTab = t.status === 'Completed';

      let matchesProject = true;
      if (selectedProjectFilter !== 'ALL') {
        matchesProject = t.projectId === selectedProjectFilter;
      }

      let matchesStatus = true;
      if (selectedStatusFilter !== 'ALL') {
        matchesStatus = t.status.toLowerCase() === selectedStatusFilter.toLowerCase();
      }

      return matchesSearch && matchesTab && matchesProject && matchesStatus;
    });
  }, [teams, searchQuery, activeTab, selectedProjectFilter, selectedStatusFilter]);

  // Open Create Drawer
  const openCreateDrawer = () => {
    // Pick first project that does not have a team yet if possible
    const availableProject = projectOptions.find((p) => !p.hasTeam) || projectOptions[0];
    const defaultLead = userOptions.find((u) => u.role === 'PROJECT_LEAD') || userOptions[0];

    setFormData({
      name: '',
      projectId: availableProject ? availableProject.id : '',
      projectLeadId: defaultLead ? defaultLead.id : '',
      memberIds: [],
    });
    setEditingTeam(null);
    setFormError('');
    setMemberSearchQuery('');
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const openEditDrawer = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      projectId: team.projectId || '',
      projectLeadId: team.projectLead?.id || '',
      memberIds: (team.members || []).map((m) => m.id),
    });
    setFormError('');
    setMemberSearchQuery('');
    setActiveMenuId(null);
    setIsDrawerOpen(true);
  };

  // Handle Member Checkbox Toggle
  const toggleMemberSelection = (userId) => {
    setFormData((prev) => {
      const exists = prev.memberIds.includes(userId);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => id !== userId)
          : [...prev.memberIds, userId],
      };
    });
  };

  // Submit Form (Create or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Team name is required');
      return;
    }
    if (!formData.projectId) {
      setFormError('Please select a project for this team');
      return;
    }
    if (!formData.projectLeadId) {
      setFormError('Please select a team lead');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');

      if (editingTeam) {
        const res = await teamAPI.updateTeam(editingTeam.id, formData);
        if (res.success) {
          setIsDrawerOpen(false);
          setEditingTeam(null);
          await fetchTeams();
          await fetchOptions();
        }
      } else {
        const res = await teamAPI.createTeam(formData);
        if (res.success) {
          setIsDrawerOpen(false);
          await fetchTeams();
          await fetchOptions();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save team');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Team
  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    try {
      await teamAPI.deleteTeam(teamToDelete.id);
      setTeamToDelete(null);
      await fetchTeams();
      await fetchOptions();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  // Filter members in drawer checkbox list
  const filteredCandidateUsers = useMemo(() => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return userOptions;
    return userOptions.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [userOptions, memberSearchQuery]);

  // Icon selector helper
  const renderTeamIcon = (iconName) => {
    switch (iconName) {
      case 'code':
        return <Code className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'chart':
        return <BarChart2 className="w-5 h-5 text-amber-600" />;
      case 'users':
        return <Users className="w-5 h-5 text-emerald-600" />;
      case 'megaphone':
        return <Megaphone className="w-5 h-5 text-indigo-600" />;
      default:
        return <UsersRound className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Top Navbar */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Navigation Drawer */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Teams"
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Hero Section matching Reference Image 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-4 pr-0 lg:pr-6">
            <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase block">
              TEAMS
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.1] font-serif">
              Build stronger <br className="hidden sm:inline" />
              teams.
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Bring the right people together. Assign teams to projects and make great things
              happen.
            </p>

            <div className="pt-2">
              <p className="text-base sm:text-lg font-serif italic text-slate-700">
                “Different skills. Same purpose.”
              </p>
              <div className="w-16 h-[2px] bg-slate-300 mt-1.5 rounded-full" />
            </div>
          </div>

          {/* Right Column: Architectural Hero Card */}
          <div className="lg:col-span-6">
            <div className="relative h-[210px] sm:h-[240px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80"
                alt="Teams and collaboration banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

              {/* Architectural Typography in Image */}
              <div className="absolute top-6 left-8 text-white/90 font-serif text-sm sm:text-base font-bold tracking-wider leading-snug drop-shadow-sm select-none">
                PEOPLE <br />
                IDEAS <br />
                TEAMS <br />
                IMPACT
              </div>

              {/* Floating Dark Green Card */}
              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 bg-[#162e25]/90 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-500/20 max-w-[210px]">
                <UsersRound className="w-5 h-5 text-emerald-400 mb-2 stroke-[1.75]" />
                <p className="text-xs sm:text-sm font-semibold text-white/95 leading-snug">
                  Great teams <br />
                  create greater <br />
                  opportunities.
                </p>
                <div className="w-12 h-[2px] bg-emerald-400/60 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Control Bar */}
        <section className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-[#162e25] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>All Teams</span>
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
          </div>

          {/* Search, Dropdowns & Create Team */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-xs rounded-xl border border-slate-200/80 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Project Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="appearance-none bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold pl-3.5 pr-8 py-2 rounded-xl border border-slate-200/80 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="ALL">All Projects</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="appearance-none bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold pl-3.5 pr-8 py-2 rounded-xl border border-slate-200/80 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Create Team Button */}
            <button
              type="button"
              onClick={openCreateDrawer}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#162e25] hover:bg-[#12241d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </section>

        {/* Content Section: Grid + Embedded Drawer matching Reference Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Teams Grid (takes full width or 8 cols when drawer is open) */}
          <div className={`${isDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-xs">Loading teams from Supabase...</span>
              </div>
            ) : displayedTeams.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <UsersRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No teams found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No teams matched "${searchQuery}". Try a different search term.`
                    : 'Assign your first team to an existing project.'}
                </p>
                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#162e25] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#12241d] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Team</span>
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  isDrawerOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                } gap-6`}
              >
                {displayedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
                  >
                    {/* Card Banner Image with Category Icon & Status Badge */}
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={team.imageUrl}
                        alt={team.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                      {/* Top-Left Category Icon Box */}
                      <div
                        className={`absolute top-3.5 left-3.5 w-10 h-10 rounded-2xl bg-white/95 shadow-md flex items-center justify-center`}
                      >
                        {renderTeamIcon(team.icon)}
                      </div>

                      {/* Top-Right Status Badge */}
                      <div className="absolute top-3.5 right-12">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs ${
                            team.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : team.status === 'On Hold'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>

                      {/* Three-Dot Menu Button */}
                      <div className="absolute top-3.5 right-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === team.id ? null : team.id)
                          }
                          className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-xs hover:bg-white transition-all"
                          title="Team Options"
                          aria-label="Team actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Action Popover */}
                        {activeMenuId === team.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => openEditDrawer(team)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Team</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTeamToDelete(team);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Team</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {team.name}
                        </h3>

                        {/* Project Link */}
                        <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                          <span>Project:</span>
                          <span
                            onClick={() => onNavigate && onNavigate('Projects')}
                            className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-bold truncate"
                          >
                            {team.projectName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2 min-h-[2rem]">
                          {team.description}
                        </p>
                      </div>

                      {/* Bottom Avatars Row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center -space-x-2">
                          {(team.members && team.members.length > 0
                            ? team.members.slice(0, 4)
                            : [team.projectLead].filter(Boolean)
                          ).map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="w-7 h-7 rounded-full bg-slate-800 ring-2 ring-white overflow-hidden text-white text-[10px] font-bold flex items-center justify-center"
                              title={m.name}
                            >
                              {m.avatar ? (
                                <img
                                  src={m.avatar}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{m.name ? m.name.charAt(0).toUpperCase() : 'U'}</span>
                              )}
                            </div>
                          ))}

                          {team.memberCount > 4 && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 ring-2 ring-white text-[10px] font-bold text-slate-600 flex items-center justify-center">
                              +{team.memberCount - 4}
                            </div>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-slate-500">
                          {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Slide-in / Embedded "Create New Team" Panel matching Reference Image 2 */}
          {isDrawerOpen && (
            <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm sticky top-24 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTeam ? 'Edit Team' : 'Create New Team'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Form a team and assign it to an existing project.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Team Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter team name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Select Project */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Project *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="">Choose a project</option>
                      {projectOptions.map((p) => {
                        const isCurrentAssigned = editingTeam && editingTeam.projectId === p.id;
                        const isUnavailable = p.hasTeam && !isCurrentAssigned;
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={isUnavailable}
                          >
                            {p.name} {isUnavailable ? '(Team already assigned)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Each project has exactly one assigned team.
                  </p>
                </div>

                {/* Team Lead */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Lead *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.projectLeadId}
                      onChange={(e) => setFormData({ ...formData, projectLeadId: e.target.value })}
                      className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="">Select a member</option>
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Team Members Multi-Select */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Team Members *
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {formData.memberIds.length} selected
                    </span>
                  </div>

                  {/* Member Search */}
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-[11px] rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Scrollable Members Checkbox List matching Reference Image 2 */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                    {filteredCandidateUsers.map((u) => {
                      const isSelected = formData.memberIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/80' : 'hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(u.id)}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                          />

                          {/* Member Avatar / Initials */}
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</span>
                            )}
                          </div>

                          {/* Member Name and Department */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {u.department || (u.role === 'PROJECT_LEAD' ? 'Project Lead' : 'Club Member')}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-2.5 bg-[#162e25] hover:bg-[#12241d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {formSubmitting
                      ? 'Saving...'
                      : editingTeam
                      ? 'Update Team'
                      : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Atmospheric Quotes matching Reference Image 2 */}
        <section className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 select-none">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-serif italic text-xs text-slate-500">
                “Alone we can do so little, together we can do so much.”
              </p>
              <div className="w-12 h-[1px] bg-slate-300 mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-serif italic text-slate-500">
            <span>Teams turn ideas into reality.</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </section>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setTeamToDelete(null)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 z-10 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Team?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-700">"{teamToDelete.name}"</span>? The project
                will remain intact.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
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

export default AdminTeams;
