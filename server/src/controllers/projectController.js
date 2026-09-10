import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Default initial projects matching the reference UI if DB is freshly setup
const INITIAL_PROJECTS = [
  {
    name: 'Website Redesign',
    description: "Revamping the club's online presence for better engagement.",
    status: 'IN_PROGRESS',
    deadline: '2026-10-10T00:00:00.000Z',
    progress: 75,
    category: 'tech',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
    teamsCount: 3,
    tasksCount: 12,
  },
  {
    name: 'Hackathon 2026',
    description: 'Organizing the annual intra-college hackathon.',
    status: 'IN_PROGRESS',
    deadline: '2026-10-15T00:00:00.000Z',
    progress: 42,
    category: 'event',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    teamsCount: 4,
    tasksCount: 23,
  },
  {
    name: 'Social Media Campaign',
    description: 'Creating engaging content to grow our reach.',
    status: 'IN_PROGRESS',
    deadline: '2026-09-30T00:00:00.000Z',
    progress: 90,
    category: 'media',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    teamsCount: 2,
    tasksCount: 8,
  },
  {
    name: 'Tech Talks Series',
    description: 'Inviting industry experts for knowledge sharing sessions.',
    status: 'ON_HOLD',
    deadline: '2026-10-20T00:00:00.000Z',
    progress: 30,
    category: 'tech',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
    teamsCount: 1,
    tasksCount: 6,
  },
  {
    name: 'Annual Fest',
    description: "Planning and managing the club's annual fest.",
    status: 'IN_PROGRESS',
    deadline: '2026-11-05T00:00:00.000Z',
    progress: 60,
    category: 'event',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80',
    teamsCount: 3,
    tasksCount: 15,
  },
  {
    name: 'Community Drive',
    description: 'A small initiative with a big impact.',
    status: 'COMPLETED',
    deadline: '2026-08-12T00:00:00.000Z',
    progress: 100,
    category: 'outreach',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    teamsCount: 2,
    tasksCount: 10,
  },
];

// Helper to auto-seed initial projects into Supabase if none exist
const ensureInitialProjects = async () => {
  if (!isSupabaseConfigured()) return;
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (!error && count === 0) {
      for (const p of INITIAL_PROJECTS) {
        await supabase.from('projects').insert({
          name: p.name,
          description: p.description,
          status: p.status,
          deadline: p.deadline,
        });
      }
    }
  } catch (err) {
    console.error('Initial projects check failed:', err.message);
  }
};

export const getProjects = async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        message: 'Database connection unavailable. Please ensure Supabase is configured.',
      });
    }

    await ensureInitialProjects();

    let query = supabase
      .from('projects')
      .select('id, name, description, deadline, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query = query.in('status', ['IN_PROGRESS', 'PLANNING']);
      } else {
        query = query.eq('status', status.toUpperCase());
      }
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    // Fetch team and task counts for each project
    const formattedProjects = await Promise.all(
      (projects || []).map(async (p) => {
        const [{ count: teamCount }, { count: taskCount }] = await Promise.all([
          supabase.from('teams').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
        ]);

        // Find reference metadata match for rich visual display
        const refMatch = INITIAL_PROJECTS.find(
          (ref) => ref.name.toLowerCase() === p.name.toLowerCase()
        );

        let progress = refMatch?.progress;
        if (progress === undefined) {
          if (p.status === 'COMPLETED') progress = 100;
          else if (p.status === 'ON_HOLD') progress = 30;
          else if (p.status === 'IN_PROGRESS') progress = 50;
          else progress = 15;
        }

        const imageUrl = refMatch?.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80';

        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          deadline: p.deadline,
          status: p.status,
          progress,
          teamCount: teamCount || refMatch?.teamsCount || 1,
          taskCount: taskCount || refMatch?.tasksCount || 0,
          imageUrl,
          createdAt: p.created_at,
          updated_at: p.updated_at,
        };
      })
    );

    // Compute stats
    const [
      { count: totalCount },
      { count: inProgressCount },
      { count: planningCount },
      { count: completedCount },
      { count: onHoldCount },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'PLANNING'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'ON_HOLD'),
    ]);

    const activeCount = (inProgressCount || 0) + (planningCount || 0);

    return res.status(200).json({
      success: true,
      stats: {
        all: totalCount || 0,
        active: activeCount || 0,
        completed: completedCount || 0,
        onHold: onHoldCount || 0,
      },
      projects: formattedProjects,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description = '', deadline, status = 'PLANNING' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const validStatuses = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
    const projectStatus = validStatuses.includes(status?.toUpperCase())
      ? status.toUpperCase()
      : 'PLANNING';

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description.trim(),
        deadline: deadline || null,
        status: projectStatus,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'CREATE_PROJECT',
        description: `Created project "${project.name}"`,
        project_id: project.id,
      });
    }

    return res.status(201).json({
      success: true,
      project: {
        ...project,
        progress: project.status === 'COMPLETED' ? 100 : 20,
        teamCount: 0,
        taskCount: 0,
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, deadline, status } = req.body;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (deadline !== undefined) updates.deadline = deadline || null;
    if (status) {
      const validStatuses = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
      if (validStatuses.includes(status.toUpperCase())) {
        updates.status = status.toUpperCase();
      }
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'UPDATE_PROJECT',
        description: `Updated project "${project.name}"`,
        project_id: project.id,
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // Get project name for activity logging before deletion
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'DELETE_PROJECT',
        description: `Deleted project "${project?.name || id}"`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};
