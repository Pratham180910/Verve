import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { memberAPI } from '../services/api';
import {
  Users,
  UserCheck,
  Clock,
  Award,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Trash2,
  Edit2,
  Shield,
  ArrowUpDown,
} from 'lucide-react';

const AdminMembers = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    projectLeads: 0,
    adminCount: 0,
    memberCount: 0,
    inactiveCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ADMIN, PROJECT_LEAD, MEMBER, INACTIVE
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Drawer / Modals State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Form State for Add Member
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MEMBER',
    department: '',
    teams: '',
    password: '',
    sendEmail: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Members from Backend
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await memberAPI.getMembers();
      if (res.success) {
        setMembers(res.members || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Tab Switch
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Dynamic tab counts derived from actual fetched members & API stats
  const tabCounts = useMemo(() => {
    const all = members.length;
    const admin = members.filter(
      (m) => (m.role || '').toUpperCase() === 'ADMIN' && (m.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'
    ).length;
    const projectLead = members.filter(
      (m) => (m.role || '').toUpperCase() === 'PROJECT_LEAD' && (m.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'
    ).length;
    const member = members.filter(
      (m) => (m.role || '').toUpperCase() === 'MEMBER' && (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    ).length;
    const inactive = members.filter(
      (m) => (m.status || '').toUpperCase() === 'INACTIVE'
    ).length;

    return {
      all: members.length ? all : (stats.totalMembers || 0),
      admin: members.length ? admin : (stats.adminCount || 0),
      projectLead: members.length ? projectLead : (stats.projectLeads || 0),
      member: members.length ? member : (stats.memberCount || 0),
      inactive: members.length ? inactive : (stats.inactiveCount || 0),
    };
  }, [members, stats]);

  // Filtered members (client-side search & filtering for instant feedback)
  const displayedMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);

      const roleUpper = (m.role || '').toUpperCase();
      const statusUpper = (m.status || 'ACTIVE').toUpperCase();

      let matchesTab = true;
      if (activeTab === 'ADMIN') {
        matchesTab = roleUpper === 'ADMIN' && statusUpper !== 'INACTIVE';
      } else if (activeTab === 'PROJECT_LEAD') {
        matchesTab = roleUpper === 'PROJECT_LEAD' && statusUpper !== 'INACTIVE';
      } else if (activeTab === 'MEMBER') {
        matchesTab = roleUpper === 'MEMBER' && statusUpper === 'ACTIVE';
      } else if (activeTab === 'INACTIVE') {
        matchesTab = statusUpper === 'INACTIVE';
      }

      let matchesRoleDropdown = true;
      if (selectedRoleFilter !== 'ALL') {
        matchesRoleDropdown = roleUpper === selectedRoleFilter.toUpperCase();
      }

      let matchesStatusDropdown = true;
      if (selectedStatusFilter !== 'ALL') {
        matchesStatusDropdown = statusUpper === selectedStatusFilter.toUpperCase();
      }

      return matchesSearch && matchesTab && matchesRoleDropdown && matchesStatusDropdown;
    });
  }, [members, searchQuery, activeTab, selectedRoleFilter, selectedStatusFilter]);

  // Handle Create Member Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      const res = await memberAPI.createMember({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        password: formData.password,
        status: 'ACTIVE',
      });

      if (res.success) {
        setIsAddDrawerOpen(false);
        setFormData({
          name: '',
          email: '',
          role: 'MEMBER',
          department: '',
          teams: '',
          password: '',
          sendEmail: true,
        });
        await fetchMembers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create member');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit Member Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      setFormSubmitting(true);
      const res = await memberAPI.updateMember(editingMember.id, {
        name: editingMember.name,
        email: editingMember.email,
        role: editingMember.role,
        status: editingMember.status,
        department: editingMember.department,
      });
      if (res.success) {
        setEditingMember(null);
        await fetchMembers();
      }
    } catch (err) {
      alert(err.message || 'Failed to update member');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Member
  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      const res = await memberAPI.deleteMember(memberToDelete.id);
      if (res.success) {
        setMemberToDelete(null);
        await fetchMembers();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Toggle Member Status (Active <-> Inactive)
  const toggleMemberStatus = async (member) => {
    try {
      const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await memberAPI.updateMember(member.id, { status: newStatus });
      setActiveActionMenuId(null);
      await fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to update member status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jan 12, 2025';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Jan 12, 2025';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      {/* Top Navbar */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={onNavigate}
      />

      {/* Slide-out Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="Members"
        onNavigate={onNavigate}
      />

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Hero / Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Heading & Philosophy */}
          <div className="lg:col-span-6 space-y-3">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              MEMBERS
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 leading-tight tracking-tight">
              People make it happen.
            </h1>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Manage club members, assign roles, and empower them to create an impact together.
            </p>
          </div>

          {/* Right: Panoramic Campus Banner with Message Badge */}
          <div className="lg:col-span-6 relative h-48 sm:h-56 w-full rounded-3xl overflow-hidden shadow-xs border border-slate-200/60 bg-slate-100">
            <img
              src="/members_banner_hero.jpg"
              alt="Campus Architecture - People make it happen"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"></div>

            {/* Overlaid Message Badge */}
            <div className="absolute bottom-4 right-4 bg-[#1f2d26]/90 backdrop-blur-md border border-white/15 text-white p-3 sm:p-3.5 rounded-2xl max-w-[240px] shadow-lg">
              <p className="text-xs font-serif italic text-white/95 leading-snug">
                &ldquo;A stronger club starts with a stronger community.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* 4 Summary Stat Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Members */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                {tabCounts.all}
              </span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Total Members</p>
            </div>
          </div>

          {/* Card 2: Active Members */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eef9f4] text-[#16a34a] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                {stats.activeMembers || (tabCounts.all - tabCounts.inactive)}
              </span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Active Members</p>
            </div>
          </div>

          {/* Card 3: Pending Invitations */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                {stats.pendingMembers || 0}
              </span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Pending Invitations</p>
            </div>
          </div>

          {/* Card 4: Project Leads */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                {tabCounts.projectLead}
              </span>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Project Leads</p>
            </div>
          </div>
        </section>

        {/* Main Member List Card */}
        <section className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          {/* Header Controls: Tabs & Action Buttons */}
          <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto text-xs font-semibold scrollbar-none">
              <button
                type="button"
                onClick={() => handleTabClick('ALL')}
                className={`pb-3 transition-colors relative whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Members ({tabCounts.all})
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('ADMIN')}
                className={`pb-3 transition-colors relative whitespace-nowrap ${
                  activeTab === 'ADMIN'
                    ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Admins ({tabCounts.admin})
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('PROJECT_LEAD')}
                className={`pb-3 transition-colors relative whitespace-nowrap ${
                  activeTab === 'PROJECT_LEAD'
                    ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Project Leads ({tabCounts.projectLead})
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('MEMBER')}
                className={`pb-3 transition-colors relative whitespace-nowrap ${
                  activeTab === 'MEMBER'
                    ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Members ({tabCounts.member})
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('INACTIVE')}
                className={`pb-3 transition-colors relative whitespace-nowrap ${
                  activeTab === 'INACTIVE'
                    ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inactive ({tabCounts.inactive})
              </button>
            </div>

            {/* Right Controls: Search, Filter, Add Member */}
            <div className="flex items-center gap-2.5 pb-2 md:pb-0">
              {/* Search Bar */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="members-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs rounded-xl border border-slate-200 focus:border-slate-300 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 z-30 space-y-2.5">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Role
                      </span>
                      <select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="PROJECT_LEAD">Project Lead</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Status
                      </span>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Member Button */}
              <button
                id="open-add-member-btn"
                type="button"
                onClick={() => setIsAddDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#164e3f] hover:bg-[#123e32] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-3.5 pl-6 pr-3 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-0" />
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Role</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Projects</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Teams</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Joined On</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    </div>
                  </th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {displayedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No members found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  displayedMembers.map((member) => {
                    const isActionOpen = activeActionMenuId === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Checkbox */}
                        <td className="py-3.5 pl-6 pr-3">
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-0" />
                        </td>

                        {/* Name & Email */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-bold text-[10px]">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="leading-tight">
                              <p className="font-bold text-slate-900">{member.name}</p>
                              <p className="text-[11px] text-slate-400 font-normal">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Pill */}
                        <td className="py-3.5 px-3">
                          {member.role === 'ADMIN' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                              Admin
                            </span>
                          )}
                          {member.role === 'PROJECT_LEAD' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-100">
                              Project Lead
                            </span>
                          )}
                          {member.role === 'MEMBER' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              Member
                            </span>
                          )}
                        </td>

                        {/* Projects */}
                        <td className="py-3.5 px-3 text-slate-600 font-normal">
                          {member.projectCount ?? 0}
                        </td>

                        {/* Teams */}
                        <td className="py-3.5 px-3 text-slate-600 font-normal">
                          {member.teamCount ?? 0}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {member.status === 'ACTIVE' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Active
                            </span>
                          )}
                          {member.status === 'INACTIVE' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                              Inactive
                            </span>
                          )}
                          {member.status === 'PENDING' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Joined On */}
                        <td className="py-3.5 px-3 text-[11px] text-slate-500 font-normal">
                          {formatDate(member.createdAt)}
                        </td>

                        {/* Actions Menu */}
                        <td className="py-3.5 pl-3 pr-6 text-right relative">
                          <button
                            type="button"
                            onClick={() => setActiveActionMenuId(isActionOpen ? null : member.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Member Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Actions Popover */}
                          {isActionOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveActionMenuId(null)}
                              />
                              <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-lg py-1.5 z-30 text-left text-xs font-medium">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMember(member);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Member</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleMemberStatus(member)}
                                  className="w-full px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                  </span>
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMemberToDelete(member);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Remove Member</span>
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Showing 1-8 of {stats.totalMembers} members</span>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30">
                &lt;
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 text-slate-900 font-bold">
                1
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
                2
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
                3
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
                4
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
                5
              </button>
              <button className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                &gt;
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* ADD MEMBER SLIDE-OVER DRAWER (Matches right-hand panel in reference UI) */}
      {/* ========================================================================= */}
      {isAddDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity duration-300"
            onClick={() => setIsAddDrawerOpen(false)}
          />

          {/* Right Drawer Panel */}
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between p-6 sm:p-7 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Member</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Invite a new member to the club.</p>
                </div>
                <button
                  id="close-add-drawer-btn"
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Fields */}
              <form id="add-member-form" onSubmit={handleAddSubmit} className="space-y-4 mt-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-member-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-member-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="new-member-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all text-slate-800"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="PROJECT_LEAD">Project Lead</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Department / Area of Interest */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Area of Interest
                  </label>
                  <input
                    id="new-member-department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Web Development, Design (Optional)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Assign to Teams (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Teams (Optional)
                  </label>
                  <select
                    value={formData.teams}
                    onChange={(e) => setFormData({ ...formData, teams: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all text-slate-500"
                  >
                    <option value="">Select teams</option>
                    <option value="frontend">Frontend Team</option>
                    <option value="backend">Backend Team</option>
                    <option value="design">UI/UX Design Team</option>
                  </select>
                </div>

                {/* Temporary Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-member-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Generate or enter password"
                      className="w-full px-3.5 py-2 pr-9 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 focus:bg-white focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Send Invitation Email Checkbox */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="send-email-checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-[#164e3f] focus:ring-0"
                  />
                  <label htmlFor="send-email-checkbox" className="text-xs text-slate-700 select-none">
                    <span className="font-semibold block">Send invitation email</span>
                    <span className="text-[11px] text-slate-400">
                      An email with login details will be sent to the member.
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="submit-add-member-btn"
                form="add-member-form"
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 rounded-xl bg-[#164e3f] hover:bg-[#123e32] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
              >
                {formSubmitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ========================================================================= */}
      {/* EDIT MEMBER MODAL */}
      {/* ========================================================================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Edit Member</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="MEMBER">Member</option>
                  <option value="PROJECT_LEAD">Project Lead</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-[#164e3f] text-white text-xs font-semibold hover:bg-[#123e32]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESTRUCTIVE ACTION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px]">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Remove Member?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">{memberToDelete.name}</strong> from the club? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                onClick={confirmDelete}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
