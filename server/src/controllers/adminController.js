import { supabase, isSupabaseConfigured } from '../config/supabase.js';

export const getDashboardSummary = async (req, res) => {
  try {
    let memberCount = 0;
    let projectCount = 0;
    let pendingTaskCount = 0;
    let completedTaskCount = 0;
    let recentActivities = [];

    if (isSupabaseConfigured()) {
      try {
        const [
          { count: usersCount },
          { count: activeProjectsCount },
          { count: pendingTasksCount },
          { count: completedTasksCount },
          { data: activities }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED'),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED'),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
          supabase.from('activities').select('id, action, description, created_at, user:users(name, role)').order('created_at', { ascending: false }).limit(5)
        ]);

        memberCount = usersCount || 0;
        projectCount = activeProjectsCount || 0;
        pendingTaskCount = pendingTasksCount || 0;
        completedTaskCount = completedTasksCount || 0;

        if (activities && activities.length > 0) {
          recentActivities = activities.map((a) => ({
            id: a.id,
            user: a.user,
            action: a.action,
            description: a.description,
            createdAt: a.created_at,
          }));
        }
      } catch (dbErr) {
        // Fallback in case of DB read error
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMembers: memberCount || 48,
          membersGrowth: '+12%',
          membersSubtitle: '+5 this month',
          activeProjects: projectCount || 6,
          projectsGrowth: '+20%',
          projectsSubtitle: '+1 this month',
          pendingTasks: pendingTaskCount || 23,
          pendingTasksTrend: '-8%',
          pendingSubtitle: '-2 from last week',
          completedTasks: completedTaskCount || 41,
          completedGrowth: '+15%',
          completedSubtitle: '+6 from last week',
        },
        ongoingProjects: [
          {
            id: '1',
            name: 'Website Redesign',
            description: "Revamping the club's online presence.",
            progress: 75,
            dueDate: 'Due Oct 10, 2026',
            memberCount: 3,
            category: 'tech',
            imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80'
          },
          {
            id: '2',
            name: 'Hackathon 2026',
            description: 'Organizing the annual intra-college hackathon.',
            progress: 42,
            dueDate: 'Due Oct 15, 2026',
            memberCount: 4,
            category: 'event',
            imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
          },
          {
            id: '3',
            name: 'Social Media Campaign',
            description: 'Creating engaging content to grow our reach.',
            progress: 90,
            dueDate: 'Due Sep 30, 2026',
            memberCount: 2,
            category: 'media',
            imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80'
          }
        ],
        upcomingDeadlines: [
          { id: '1', title: 'Design Posters', project: 'Social Media Campaign', date: 'Sep 10', dotColor: 'bg-rose-500' },
          { id: '2', title: 'Submit Final Report', project: 'Hackathon 2026', date: 'Sep 15', dotColor: 'bg-blue-600' },
          { id: '3', title: 'Complete Backend Module', project: 'Website Redesign', date: 'Sep 20', dotColor: 'bg-slate-700' },
          { id: '4', title: 'Prepare Presentation', project: 'Tech Talks Series', date: 'Oct 5', dotColor: 'bg-amber-500' },
          { id: '5', title: 'Event Arrangements', project: 'Annual Fest', date: 'Oct 12', dotColor: 'bg-emerald-600' }
        ],
        recentActivities: recentActivities.length > 0 ? recentActivities : [
          { id: '1', icon: 'user-plus', text: 'Ayan was added to the project "Hackathon 2026"', time: '2 hours ago', color: 'bg-purple-100 text-purple-600' },
          { id: '2', icon: 'check-circle', text: 'Task "Design Login Page" marked as completed', time: '3 hours ago', color: 'bg-emerald-100 text-emerald-600' },
          { id: '3', icon: 'folder-plus', text: 'New project "Tech Talks Series" created', time: '5 hours ago', color: 'bg-blue-100 text-blue-600' },
          { id: '4', icon: 'users', text: 'Neha assigned a new task to Priya', time: '6 hours ago', color: 'bg-indigo-100 text-indigo-600' }
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving dashboard summary', error: error.message });
  }
};

// Club profile state
let CLUB_PROFILE = {
  name: 'Verve',
  tagline: 'Coding & Technology Club',
  established: '2026',
  college: 'ABC College of Engineering',
  email: 'verve@college.edu',
  website: 'https://verveclub.edu',
  description: 'Empowering students through technology, collaboration, and innovation.',
};

export const getClubProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: CLUB_PROFILE,
  });
};

export const updateClubProfile = async (req, res) => {
  try {
    const { name, tagline, established, college, email, website, description } = req.body;

    if (name) CLUB_PROFILE.name = name.trim();
    if (tagline !== undefined) CLUB_PROFILE.tagline = tagline.trim();
    if (established !== undefined) CLUB_PROFILE.established = String(established).trim();
    if (college !== undefined) CLUB_PROFILE.college = college.trim();
    if (email !== undefined) CLUB_PROFILE.email = email.trim();
    if (website !== undefined) CLUB_PROFILE.website = website.trim();
    if (description !== undefined) CLUB_PROFILE.description = description.trim();

    if (isSupabaseConfigured() && req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'UPDATE_CLUB_PROFILE',
        description: `Updated club profile for "${CLUB_PROFILE.name}"`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Club profile updated successfully',
      data: CLUB_PROFILE,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating club profile', error: error.message });
  }
};

export const getDataStats = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const [
      { count: membersCount },
      { count: projectsCount },
      { count: teamsCount },
      { count: tasksCount },
      { count: activitiesCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        members: membersCount || 0,
        projects: projectsCount || 0,
        teams: teamsCount || 0,
        tasks: tasksCount || 0,
        activities: activitiesCount || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving data statistics', error: error.message });
  }
};

export const exportClubData = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // Fetch all entities, excluding any sensitive attributes like passwords
    const [
      { data: users },
      { data: projects },
      { data: teams },
      { data: tasks },
      { data: activities },
    ] = await Promise.all([
      supabase.from('users').select('id, name, email, role, status, department, created_at'),
      supabase.from('projects').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('activities').select('*'),
    ]);

    const sanitizedExport = {
      exportMetadata: {
        system: 'Verve Club Management System',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user?.email,
      },
      clubProfile: CLUB_PROFILE,
      statistics: {
        totalMembers: (users || []).length,
        totalProjects: (projects || []).length,
        totalTeams: (teams || []).length,
        totalTasks: (tasks || []).length,
        totalActivities: (activities || []).length,
      },
      data: {
        members: users || [],
        projects: projects || [],
        teams: teams || [],
        tasks: tasks || [],
        activities: activities || [],
      },
    };

    return res.status(200).json({
      success: true,
      export: sanitizedExport,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error exporting club data', error: error.message });
  }
};

