import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Initial visual team metadata matching reference UI
const INITIAL_TEAMS = [
  {
    name: 'Web Development Team',
    projectName: 'Website Redesign',
    description: "Building and maintaining the club's digital presence.",
    icon: 'code',
    iconColor: 'bg-blue-100 text-blue-600',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'PROJECT_LEAD',
  },
  {
    name: 'Content & Design Team',
    projectName: 'Social Media Campaign',
    description: 'Creating engaging visual and written content.',
    icon: 'video',
    iconColor: 'bg-rose-100 text-rose-600',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'PROJECT_LEAD',
  },
  {
    name: 'Event Management Team',
    projectName: 'Annual Fest',
    description: 'Planning and executing club events end-to-end.',
    icon: 'calendar',
    iconColor: 'bg-purple-100 text-purple-600',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'PROJECT_LEAD',
  },
  {
    name: 'Research Team',
    projectName: 'Hackathon 2026',
    description: 'Exploring ideas and gathering technical resources.',
    icon: 'chart',
    iconColor: 'bg-amber-100 text-amber-600',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'PROJECT_LEAD',
  },
  {
    name: 'Outreach Team',
    projectName: 'Community Drive',
    description: 'Connecting with new members and external collaborations.',
    icon: 'users',
    iconColor: 'bg-emerald-100 text-emerald-600',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'MEMBER',
  },
  {
    name: 'Operations Team',
    projectName: 'Tech Talks Series',
    description: 'Handling logistics, coordination and internal operations.',
    icon: 'megaphone',
    iconColor: 'bg-indigo-100 text-indigo-600',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
    sampleLeadRole: 'ADMIN',
  },
];

// Helper to seed initial teams linked to existing projects
const ensureInitialTeams = async () => {
  if (!isSupabaseConfigured()) return;
  try {
    const { count, error } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    if (!error && count === 0) {
      // Get all projects and users
      const [{ data: projects }, { data: users }] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('users').select('id, role'),
      ]);

      if (!projects || projects.length === 0 || !users || users.length === 0) return;

      const leadUser = users.find((u) => u.role === 'PROJECT_LEAD') || users[0];
      const memberUsers = users.filter((u) => u.id !== leadUser.id);

      for (const t of INITIAL_TEAMS) {
        const project = projects.find(
          (p) => p.name.toLowerCase() === t.projectName.toLowerCase()
        );
        if (!project) continue;

        // Check if team already exists for this project
        const { data: existing } = await supabase
          .from('teams')
          .select('id')
          .eq('project_id', project.id)
          .maybeSingle();

        if (existing) continue;

        const { data: createdTeam, error: insertError } = await supabase
          .from('teams')
          .insert({
            name: t.name,
            project_id: project.id,
            project_lead_id: leadUser.id,
          })
          .select('id')
          .single();

        if (insertError || !createdTeam) continue;

        // Add member relations
        for (const m of memberUsers) {
          await supabase.from('team_members').insert({
            team_id: createdTeam.id,
            user_id: m.id,
          });
        }
      }
    }
  } catch (err) {
    console.error('Initial teams setup check error:', err.message);
  }
};

export const getTeams = async (req, res) => {
  try {
    const { search = '', status = '', projectId = '' } = req.query;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        message: 'Database connection unavailable. Please ensure Supabase is configured.',
      });
    }

    await ensureInitialTeams();

    let query = supabase
      .from('teams')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        project:projects!project_id (
          id,
          name,
          status,
          deadline
        ),
        project_lead:users!project_lead_id (
          id,
          name,
          email,
          role,
          avatar,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (projectId && projectId !== 'ALL') {
      query = query.eq('project_id', projectId);
    }

    const { data: teams, error } = await query;
    if (error) throw error;

    // Fetch members for each team
    const formattedTeams = await Promise.all(
      (teams || []).map(async (team) => {
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select(`
            user:users!user_id (
              id,
              name,
              email,
              role,
              avatar,
              department
            )
          `)
          .eq('team_id', team.id);

        const membersList = (teamMembers || []).map((tm) => tm.user).filter(Boolean);

        // Map status from project
        const projectStatus = team.project?.status || 'IN_PROGRESS';
        let displayStatus = 'Active';
        if (projectStatus === 'COMPLETED') displayStatus = 'Completed';
        else if (projectStatus === 'ON_HOLD') displayStatus = 'On Hold';

        // Match visual icon / image from reference
        const refMatch = INITIAL_TEAMS.find(
          (ref) => ref.name.toLowerCase() === team.name.toLowerCase()
        );

        return {
          id: team.id,
          name: team.name,
          projectId: team.project?.id,
          projectName: team.project?.name || 'Unassigned Project',
          projectStatus,
          status: displayStatus,
          description: refMatch?.description || `Team working on ${team.project?.name || 'club initiatives'}.`,
          projectLead: team.project_lead,
          members: membersList,
          memberCount: membersList.length,
          icon: refMatch?.icon || 'users',
          iconColor: refMatch?.iconColor || 'bg-slate-100 text-slate-700',
          imageUrl: refMatch?.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
          createdAt: team.created_at,
          updated_at: team.updated_at,
        };
      })
    );

    // Filter by display status if requested
    let filtered = formattedTeams;
    if (status && status !== 'ALL') {
      filtered = filtered.filter(
        (t) => t.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Stats
    const totalCount = formattedTeams.length;
    const activeCount = formattedTeams.filter((t) => t.status === 'Active').length;
    const onHoldCount = formattedTeams.filter((t) => t.status === 'On Hold').length;
    const completedCount = formattedTeams.filter((t) => t.status === 'Completed').length;

    return res.status(200).json({
      success: true,
      stats: {
        all: totalCount,
        active: activeCount,
        onHold: onHoldCount,
        completed: completedCount,
      },
      teams: filtered,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving teams', error: error.message });
  }
};

export const getTeamOptions = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // Fetch projects and users
    const [{ data: projects, error: pErr }, { data: users, error: uErr }, { data: existingTeams }] =
      await Promise.all([
        supabase.from('projects').select('id, name, status').order('name', { ascending: true }),
        supabase.from('users').select('id, name, email, role, department, avatar').order('name', { ascending: true }),
        supabase.from('teams').select('project_id'),
      ]);

    if (pErr) throw pErr;
    if (uErr) throw uErr;

    const assignedProjectIds = new Set((existingTeams || []).map((t) => t.project_id));

    const formattedProjects = (projects || []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      hasTeam: assignedProjectIds.has(p.id),
    }));

    return res.status(200).json({
      success: true,
      projects: formattedProjects,
      users: users || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error loading options', error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, projectId, projectLeadId, memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    if (!projectId) {
      return res.status(400).json({ message: 'A project must be selected for the team' });
    }
    if (!projectLeadId) {
      return res.status(400).json({ message: 'A team lead must be selected' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // One-team-per-project constraint verification
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id, name')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existingTeam) {
      return res.status(400).json({
        message: `This project already has an assigned team ("${existingTeam.name}"). Each project can have only one team.`,
      });
    }

    // Insert team
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        project_id: projectId,
        project_lead_id: projectLeadId,
      })
      .select(`
        id,
        name,
        project_id,
        project_lead_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    // Add member associations
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const inserts = memberIds.map((userId) => ({
        team_id: team.id,
        user_id: userId,
      }));
      await supabase.from('team_members').insert(inserts);
    }

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'CREATE_TEAM',
        description: `Created team "${team.name}"`,
        project_id: projectId,
      });
    }

    return res.status(201).json({
      success: true,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, projectId, projectLeadId, memberIds } = req.body;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // If changing project, verify one-team-per-project constraint
    if (projectId) {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id, name')
        .eq('project_id', projectId)
        .neq('id', id)
        .maybeSingle();

      if (existingTeam) {
        return res.status(400).json({
          message: `The selected project already has an assigned team ("${existingTeam.name}").`,
        });
      }
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name && name.trim()) updates.name = name.trim();
    if (projectId) updates.project_id = projectId;
    if (projectLeadId) updates.project_lead_id = projectLeadId;

    const { data: team, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Update members if memberIds array provided
    if (Array.isArray(memberIds)) {
      // Delete old members
      await supabase.from('team_members').delete().eq('team_id', id);

      // Insert new members
      if (memberIds.length > 0) {
        const inserts = memberIds.map((userId) => ({
          team_id: id,
          user_id: userId,
        }));
        await supabase.from('team_members').insert(inserts);
      }
    }

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'UPDATE_TEAM',
        description: `Updated team "${team.name}"`,
        project_id: team.project_id,
      });
    }

    return res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating team', error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { data: team } = await supabase
      .from('teams')
      .select('name, project_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;

    // Record activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'DELETE_TEAM',
        description: `Deleted team "${team?.name || id}"`,
        project_id: team?.project_id || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
};
