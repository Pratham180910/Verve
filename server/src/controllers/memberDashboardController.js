import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Helper to get member's participating team IDs and project IDs
const getMemberScope = async (memberId) => {
  const { data: teamJoins, error: tmErr } = await supabase
    .from('team_members')
    .select('team_id, team:teams(id, name, project_id, project_lead_id)')
    .eq('user_id', memberId);

  if (tmErr || !teamJoins) return { teamIds: [], projectIds: [], teams: [] };

  const teamIds = (teamJoins || []).map((tj) => tj.team_id).filter(Boolean);
  const projectIds = (teamJoins || []).map((tj) => tj.team?.project_id).filter(Boolean);
  const teams = (teamJoins || []).map((tj) => tj.team).filter(Boolean);

  return { teamIds, projectIds, teams };
};

// 1. MEMBER DASHBOARD
export const getMemberDashboard = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const memberId = req.user.id;
    const { teamIds, projectIds, teams } = await getMemberScope(memberId);

    // Fetch projects where member participates
    let formattedProjects = [];
    if (projectIds.length > 0) {
      const { data: rawProjects } = await supabase
        .from('projects')
        .select('id, name, description, deadline, status')
        .in('id', projectIds);

      // Fetch all tasks in these projects to calculate actual progress
      const { data: projTasks } = await supabase
        .from('tasks')
        .select('id, project_id, status')
        .in('project_id', projectIds);

      formattedProjects = (rawProjects || []).map((p) => {
        const pTasks = (projTasks || []).filter((t) => t.project_id === p.id);
        const completed = pTasks.filter((t) => t.status === 'COMPLETED').length;
        const progress = pTasks.length > 0
          ? Math.round((completed / pTasks.length) * 100)
          : (p.status === 'COMPLETED' ? 100 : (p.status === 'IN_PROGRESS' ? 60 : (p.status === 'ON_HOLD' ? 30 : 20)));

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          deadline: p.deadline,
          status: p.status,
          progress,
          role: 'Member',
        };
      });
    }

    // 2. Fetch Tasks assigned to this Member ONLY
    const { data: myTasks, error: taskErr } = await supabase
      .from('tasks')
      .select('id, title, description, priority, status, deadline, project_id, created_at, project:projects(id, name)')
      .eq('assigned_to', memberId)
      .order('deadline', { ascending: true });

    if (taskErr) throw taskErr;

    // 3. Compute Stats for Member
    const completedTasks = (myTasks || []).filter((t) => t.status === 'COMPLETED');
    const inProgressTasks = (myTasks || []).filter((t) => t.status === 'IN_PROGRESS');
    const todoTasks = (myTasks || []).filter((t) => t.status === 'TODO');

    // 4. Fetch team members in member's teams
    let distinctTeamMembers = [];
    if (teamIds.length > 0) {
      const { data: rawTeamMembers } = await supabase
        .from('team_members')
        .select('user:users(id, name, email, role, department, avatar)')
        .in('team_id', teamIds);

      const memMap = new Map();
      (rawTeamMembers || []).forEach((tm) => {
        if (tm.user && tm.user.id !== memberId && !memMap.has(tm.user.id)) {
          memMap.set(tm.user.id, {
            id: tm.user.id,
            name: tm.user.name,
            email: tm.user.email,
            role: tm.user.role,
            department: tm.user.department || 'Team Member',
            avatar: tm.user.avatar || '',
          });
        }
      });
      distinctTeamMembers = Array.from(memMap.values());
    }

    // 5. Relevant Announcements & Activity
    let announcements = [];
    if (projectIds.length > 0) {
      const { data: activities } = await supabase
        .from('activities')
        .select('id, action, description, created_at')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(6);

      announcements = (activities || []).map((a) => {
        let title = a.description;
        if (title.length > 55) title = title.substring(0, 55) + '...';
        const d = new Date(a.created_at);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return {
          id: a.id,
          title,
          date: dateStr,
        };
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        projectCount: formattedProjects.length,
        taskCount: (myTasks || []).length,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        todoCount: todoTasks.length,
      },
      tasks: myTasks || [],
      projects: formattedProjects,
      teamMembers: distinctTeamMembers,
      announcements: announcements.length > 0 ? announcements : [
        { id: '1', title: 'Welcome to the Verve Member Portal', date: 'Today' },
      ],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving member dashboard', error: error.message });
  }
};

// 2. MY TASKS (view assigned tasks only)
export const getMemberTasks = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const memberId = req.user.id;
    const { search, status, priority } = req.query;

    let query = supabase
      .from('tasks')
      .select('id, title, description, priority, status, deadline, created_at, project_id, assigned_to, project:projects(id, name)')
      .eq('assigned_to', memberId)
      .order('deadline', { ascending: true });

    if (status && status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    if (priority && priority !== 'ALL') {
      query = query.eq('priority', priority.toUpperCase());
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Get stats for all member tasks
    const { data: allMemberTasks } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('assigned_to', memberId);

    const stats = {
      total: (allMemberTasks || []).length,
      todo: (allMemberTasks || []).filter((t) => t.status === 'TODO').length,
      inProgress: (allMemberTasks || []).filter((t) => t.status === 'IN_PROGRESS').length,
      completed: (allMemberTasks || []).filter((t) => t.status === 'COMPLETED').length,
    };

    return res.status(200).json({
      success: true,
      tasks: tasks || [],
      totalCount: (tasks || []).length,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving member tasks', error: error.message });
  }
};

// 3. UPDATE TASK STATUS (Member can only update their own task status)
export const updateMemberTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // STRICT SECURITY CHECK: Member can ONLY update tasks assigned to THEMSELVES!
    const { data: task, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, project_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied: You can only update the status of tasks assigned to you.',
      });
    }

    const { data: updatedTask, error: updateErr } = await supabase
      .from('tasks')
      .update({
        status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, title, description, priority, status, deadline, project_id, project:projects(id, name)')
      .single();

    if (updateErr) throw updateErr;

    // Log activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: status.toUpperCase() === 'COMPLETED' ? 'COMPLETE_TASK' : 'UPDATE_TASK_STATUS',
      description: `Member ${req.user.name} moved task "${task.title}" to ${status.replace('_', ' ')}`,
      project_id: task.project_id,
      task_id: task.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

// 4. MY PROJECTS (view participating projects only)
export const getMemberProjects = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const memberId = req.user.id;
    const { teamIds, projectIds } = await getMemberScope(memberId);

    if (projectIds.length === 0) {
      return res.status(200).json({ success: true, projects: [], stats: { all: 0, active: 0, onHold: 0, completed: 0 } });
    }

    const { search, status } = req.query;

    let query = supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query = query.in('status', ['IN_PROGRESS', 'PLANNING']);
      } else {
        query = query.eq('status', status.toUpperCase());
      }
    }

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    const [{ data: projects, error }, { data: tasks }, { data: teams }] = await Promise.all([
      query,
      supabase.from('tasks').select('id, title, status, priority, deadline, project_id, assigned_to, assignee:users!tasks_assigned_to_fkey(id, name, avatar)').in('project_id', projectIds),
      supabase.from('teams').select('id, name, project_id, project_lead_id, lead:users!teams_project_lead_id_fkey(id, name, email, avatar)').in('id', teamIds),
    ]);

    if (error) throw error;

    // Get team members for member's teams
    const { data: rawMembers } = await supabase
      .from('team_members')
      .select('team_id, user:users(id, name, email, role, avatar, department)')
      .in('team_id', teamIds);

    const formattedProjects = (projects || []).map((proj) => {
      const projTasks = (tasks || []).filter((t) => t.project_id === proj.id);
      const completedTasks = projTasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : (proj.status === 'COMPLETED' ? 100 : (proj.status === 'IN_PROGRESS' ? 60 : (proj.status === 'ON_HOLD' ? 30 : 20)));

      const projTeam = (teams || []).find((t) => t.project_id === proj.id);
      const projMembers = projTeam
        ? (rawMembers || []).filter((m) => m.team_id === projTeam.id && m.user).map((m) => m.user)
        : [];

      return {
        ...proj,
        progress,
        tasks: projTasks,
        taskCount: projTasks.length,
        completedTaskCount: completedTasks,
        team: projTeam ? { id: projTeam.id, name: projTeam.name, lead: projTeam.lead, members: projMembers } : null,
      };
    });

    const { data: allParticipatingProjects } = await supabase.from('projects').select('id, status').in('id', projectIds);
    const stats = {
      all: (allParticipatingProjects || []).length,
      active: (allParticipatingProjects || []).filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length,
      completed: (allParticipatingProjects || []).filter((p) => p.status === 'COMPLETED').length,
      onHold: (allParticipatingProjects || []).filter((p) => p.status === 'ON_HOLD').length,
    };

    return res.status(200).json({ success: true, projects: formattedProjects, stats });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
};

// 5. MY TEAM (view member's teams only)
export const getMemberTeams = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const memberId = req.user.id;
    const { teamIds, projectIds } = await getMemberScope(memberId);

    if (teamIds.length === 0) {
      return res.status(200).json({ success: true, teams: [] });
    }

    const [{ data: rawTeams }, { data: rawTeamMembers }, { data: projects }] = await Promise.all([
      supabase.from('teams').select('id, name, project_id, project_lead_id, lead:users!teams_project_lead_id_fkey(id, name, email, department, avatar)').in('id', teamIds),
      supabase.from('team_members').select('team_id, user:users(id, name, email, role, department, avatar)').in('team_id', teamIds),
      supabase.from('projects').select('id, name, status, deadline').in('id', projectIds),
    ]);

    const formattedTeams = (rawTeams || []).map((t) => {
      const proj = (projects || []).find((p) => p.id === t.project_id);
      const teamMems = (rawTeamMembers || [])
        .filter((tm) => tm.team_id === t.id && tm.user)
        .map((tm) => tm.user);

      return {
        id: t.id,
        name: t.name,
        project: proj || null,
        lead: t.lead || null,
        members: teamMems,
        memberCount: teamMems.length,
      };
    });

    return res.status(200).json({
      success: true,
      teams: formattedTeams,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving teams', error: error.message });
  }
};

// 6. MEMBER ACTIVITY (relevant events only)
export const getMemberActivities = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const memberId = req.user.id;
    const { projectIds } = await getMemberScope(memberId);

    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        activities: [],
        stats: { totalActivities: 0, tasksUpdated: 0, projectsInvolved: 0 },
      });
    }

    const { category, days = '7', search } = req.query;

    let query = supabase
      .from('activities')
      .select('id, action, description, project_id, task_id, created_at, user:users(id, name, avatar, role)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (category && category !== 'ALL') {
      if (category === 'TASKS') {
        query = query.in('action', ['CREATE_TASK', 'UPDATE_TASK', 'UPDATE_TASK_STATUS', 'COMPLETE_TASK']);
      } else if (category === 'PROJECTS') {
        query = query.in('action', ['CREATE_PROJECT', 'UPDATE_PROJECT']);
      }
    }

    if (days && days !== 'ALL') {
      const numDays = parseInt(days, 10) || 7;
      const sinceDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', sinceDate);
    }

    if (search && search.trim()) {
      query = query.ilike('description', `%${search.trim()}%`);
    }

    const { data: activities, error } = await query;
    if (error) throw error;

    const stats = {
      totalActivities: (activities || []).length,
      tasksUpdated: (activities || []).filter((a) => a.action && a.action.includes('TASK')).length,
      projectsInvolved: projectIds.length,
    };

    return res.status(200).json({
      success: true,
      activities: activities || [],
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving activities', error: error.message });
  }
};

// 7. MEMBER PROFILE UPDATE
export const updateMemberProfile = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updates = {
      name: name.trim(),
      updated_at: new Date().toISOString(),
    };
    if (department !== undefined) {
      updates.department = department?.trim() || 'Club Member';
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, department, status, avatar, created_at')
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// 8. SECURITY GUARDS - Block Member from modifying tasks/projects/teams
export const blockMemberAction = (actionName) => (req, res) => {
  return res.status(403).json({
    message: `Access denied: Members are not permitted to ${actionName}.`,
  });
};
