import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Folder,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Leaf,
  Calendar,
  UserPlus,
  FolderPlus,
  UsersRound,
} from 'lucide-react';

const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminAPI.getDashboard();
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = dashboardData?.stats || {
    totalMembers: 48,
    membersGrowth: '+12%',
    membersSubtitle: '+5 this month',
    activeProjects: 6,
    projectsGrowth: '+20%',
    projectsSubtitle: '+1 this month',
    pendingTasks: 23,
    pendingTasksTrend: '-8%',
    pendingSubtitle: '-2 from last week',
    completedTasks: 41,
    completedGrowth: '+15%',
    completedSubtitle: '+6 from last week',
  };

  const ongoingProjects = dashboardData?.ongoingProjects || [
    {
      id: '1',
      name: 'Website Redesign',
      description: "Revamping the club's online presence.",
      progress: 75,
      dueDate: 'Due Oct 10, 2026',
      memberCount: 2,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      name: 'Hackathon 2026',
      description: 'Organizing the annual intra-college hackathon.',
      progress: 42,
      dueDate: 'Due Oct 15, 2026',
      memberCount: 3,
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      name: 'Social Media Campaign',
      description: 'Creating engaging content to grow our reach.',
      progress: 90,
      dueDate: 'Due Sep 30, 2026',
      memberCount: 1,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [
    { id: '1', title: 'Design Posters', project: 'Social Media Campaign', date: 'Sep 10', dotColor: 'bg-rose-400' },
    { id: '2', title: 'Submit Final Report', project: 'Hackathon 2026', date: 'Sep 15', dotColor: 'bg-blue-500' },
    { id: '3', title: 'Complete Backend Module', project: 'Website Redesign', date: 'Sep 20', dotColor: 'bg-slate-700' },
    { id: '4', title: 'Prepare Presentation', project: 'Tech Talks Series', date: 'Oct 5', dotColor: 'bg-orange-400' },
    { id: '5', title: 'Event Arrangements', project: 'Annual Fest', date: 'Oct 12', dotColor: 'bg-emerald-500' },
  ];

  const recentActivities = [
    {
      id: '1',
      icon: UserPlus,
      text: 'Ayan was added to the project "Hackathon 2026"',
      time: '2 hours ago',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: '2',
      icon: CheckCircle2,
      text: 'Task "Design Login Page" marked as completed',
      time: '3 hours ago',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: '3',
      icon: FolderPlus,
      text: 'New project "Tech Talks Series" created',
      time: '5 hours ago',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: '4',
      icon: UsersRound,
      text: 'Neha assigned a new task to Priya',
      time: '6 hours ago',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

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
        activePage="Home"
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero / Welcome Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Greeting & Philosophy */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {(() => {
                const now = new Date();
                const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
                return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
              })()}
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 leading-tight">
              Good evening,<br />
              <span className="font-sans font-bold text-slate-900">
                {user?.name || 'Admin'}.
              </span>
            </h1>
            <p className="text-sm text-slate-500 max-w-sm">
              Here&apos;s what&apos;s happening with your club today.
            </p>

            <div className="pt-4">
              <p className="text-sm font-serif italic text-slate-600">
                &ldquo;Build a community, not just a club.&rdquo;
              </p>
              <div className="w-8 h-0.5 bg-slate-300 mt-2 rounded-full"></div>
            </div>
          </div>

          {/* Right: Architectural Clubhouse Image Banner */}
          <div className="lg:col-span-7 relative h-64 sm:h-72 md:h-80 w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-100">
            <img
              src="/club_pavilion_hero.jpg"
              alt="Ideas People Projects Impact - Verve Clubhouse"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            {/* Floating Glassmorphism Badge */}
            <div className="absolute bottom-4 right-4 bg-[#1f2d26]/85 backdrop-blur-md border border-white/15 text-white p-3.5 sm:p-4 rounded-2xl max-w-[260px] shadow-lg">
              <div className="flex items-start gap-2.5">
                <Leaf className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/95 font-medium leading-snug">
                  A student club platform for a brighter tomorrow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Summary Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Members */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#eef9f4] text-[#16a34a] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">Total Members</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.totalMembers}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {stats.membersGrowth}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.membersSubtitle}</p>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#eef9f4] text-[#16a34a] flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">Active Projects</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.activeProjects}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {stats.projectsGrowth}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.projectsSubtitle}</p>
            </div>
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#fff4ed] text-[#ea580c] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">Pending Tasks</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.pendingTasks}
                </span>
                <span className="text-xs font-semibold text-rose-500 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {stats.pendingTasksTrend}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.pendingSubtitle}</p>
            </div>
          </div>

          {/* Card 4: Completed Tasks */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#eef9f4] text-[#16a34a] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">Completed Tasks</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.completedTasks}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {stats.completedGrowth}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.completedSubtitle}</p>
            </div>
          </div>
        </section>

        {/* Lower Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Ongoing Projects & Recent Activity (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Ongoing Projects Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => onNavigate && onNavigate('Projects')}
                  className="flex items-center gap-1.5 text-slate-900 font-bold text-base cursor-pointer hover:text-emerald-800 transition-colors"
                >
                  <span>Ongoing Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('Projects')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              {/* Projects 3-Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ongoingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Card Thumbnail Banner */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                      <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow-xs hover:bg-white hover:text-slate-900 transition-all"
                        aria-label="View project details"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer: Members & Due Date */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center -space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                            A
                          </div>
                          <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                            B
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 pl-2">
                            +{project.memberCount}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {project.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-base">
                <span>Recent Activity</span>
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Horizontal Activity Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
                          {act.text}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium pl-9">
                        {act.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Upcoming Deadlines & Motivation Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upcoming Deadlines Card */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-base">
                  <span>Upcoming Deadlines</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-5 relative">
                {upcomingDeadlines.map((item, idx) => (
                  <div key={item.id} className="relative flex items-start gap-3.5">
                    {/* Connecting line */}
                    {idx !== upcomingDeadlines.length - 1 && (
                      <div className="absolute left-[5px] top-3 bottom-[-16px] w-[1px] bg-slate-200" />
                    )}

                    {/* Timeline Dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${item.dotColor} ring-2 ring-white z-10`}
                    />

                    {/* Deadline Details */}
                    <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.project}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Motivational Banner Card */}
            <div className="bg-gradient-to-r from-[#eef7f2] to-[#e4f3eb] border border-emerald-200/60 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Botanical leaf SVG */}
                <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center text-emerald-700 shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-serif font-semibold text-slate-800 leading-tight">
                    Same people.<br />
                    Bigger possibilities.
                  </p>
                  <div className="w-6 h-0.5 bg-emerald-600/40 mt-1 rounded-full"></div>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0"
                aria-label="View more"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
