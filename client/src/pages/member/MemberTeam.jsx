import React, { useState, useEffect } from 'react';
import MemberNavbar from '../../components/MemberNavbar';
import MemberSidebar from '../../components/MemberSidebar';
import { memberDashboardAPI } from '../../services/api';
import {
  Users,
  Search,
  Mail,
  Folder,
  UserCheck,
  Shield,
  Clock,
} from 'lucide-react';

const MemberTeam = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await memberDashboardAPI.getTeams();
      if (res.success) {
        setTeams(res.teams || []);
      }
    } catch (err) {
      console.error('Failed to load member teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.project && t.project.name.toLowerCase().includes(q)) ||
      (t.lead && t.lead.name.toLowerCase().includes(q)) ||
      (t.members && t.members.some((m) => m.name.toLowerCase().includes(q)))
    );
  });

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
        activePage="My Team"
        onNavigate={onNavigate}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
              My Team
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Teams you collaborate with, their Project Leads, and fellow teammates.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams or teammates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
          </div>
        </div>

        {/* Teams List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading your teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-slate-200/80 text-center p-8 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No teams found</p>
            <p className="text-xs text-slate-400">You are not currently enrolled in any teams.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Team & Project Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-serif">
                        {team.name}
                      </h3>
                      {team.project && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Folder className="w-3.5 h-3.5 text-blue-600" />
                          <span>Project: {team.project.name}</span>
                          <span
                            className={`ml-1 text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              team.project.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : team.project.status === 'ON_HOLD'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {team.project.status}
                          </span>
                        </div>
                      )}
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                      {team.memberCount} members
                    </span>
                  </div>

                  {/* Project Lead Card */}
                  {team.lead && (
                    <div className="p-3 bg-[#eef7f2]/60 rounded-2xl border border-emerald-200/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#1e3a2f] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(team.lead.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {team.lead.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {team.lead.email}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        Project Lead
                      </span>
                    </div>
                  )}

                  {/* Members Grid */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Team Members ({team.members?.length || 0})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block text-xs truncate">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {member.role} • {member.department || 'Member'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberTeam;
