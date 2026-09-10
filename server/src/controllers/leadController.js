import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Helper to get lead's managed project IDs and team IDs
const getLeadScope = async (leadUserId) => {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, project_id, project_lead_id')
    .eq('project_lead_id', leadUserId);

  if (error || !teams) return { teams: [], projectIds: [], teamIds: [] };

  const projectIds = teams.map((t) => t.project_id).filter(Boolean);
  const teamIds = teams.map((t) => t.id).filter(Boolean);

  return { teams, projectIds, teamIds };
};

// Helper to get all allowed assignees for a lead (lead + team members of lead's teams)
const getLeadAllowedAssigneeIds = async (leadUserId, teamIds) => {
  const allowed = new Set([leadUserId]);
  if (teamIds && teamIds.length > 0) {
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .in('team_id', teamIds);
    (members || []).forEach((m) => {
      if (m.user_id) allowed.add(m.user_id);
    });
  }
  return allowed;
};

// 1. DASHBOARD
export const getLeadDashboard = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { teams, projectIds, teamIds } = await getLeadScope(req.user.id);

    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          projectCount: 0,
          teamMemberCount: 0,
          openTasksCount: 0,
          completedTasksCount: 0,
        },
        projects: [],
        tasks: [],
        teamMembers: [],
        milestones: [],
        recentActivities: [],
      });
    }

    // 1. Fetch Lead Projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, deadline, status, created_at')
      .in('id', projectIds)
      .order('created_at', { ascending: false });

    // 2. Fetch Tasks for these projects
    const { data: tasks } = await supabase
      .from('tasks')
      .select(
        'id, title, description, priority, status, deadline, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, department)'
      )
      .in('project_id', projectIds)
      .order('deadline', { ascending: true });

    // 3. Fetch Team Members
    const { data: rawTeamMembers } = await supabase
      .from('team_members')
      .select('user_id, team_id, user:users(id, name, email, role, department, avatar)')
      .in('team_id', teamIds);

    // Deduplicate distinct team members
    const memberMap = new Map();
    (rawTeamMembers || []).forEach((tm) => {
      if (tm.user && !memberMap.has(tm.user.id)) {
        memberMap.set(tm.user.id, {
          id: tm.user.id,
          name: tm.user.name,
          email: tm.user.email,
          role: tm.user.role,
          department: tm.user.department || 'Team Member',
          avatar: tm.user.avatar || '',
        });
      }
    });
    const distinctTeamMembers = Array.from(memberMap.values());

    // Compute Project progress based on completed tasks
    const formattedProjects = (projects || []).map((p) => {
      const pTasks = (tasks || []).filter((t) => t.project_id === p.id);
      const completedPTasks = pTasks.filter((t) => t.status === 'COMPLETED').length;
      let progress = 0;
      if (pTasks.length > 0) {
        progress = Math.round((completedPTasks / pTasks.length) * 100);
      } else if (p.status === 'COMPLETED') {
        progress = 100;
      } else if (p.status === 'IN_PROGRESS') {
        progress = 60;
      } else if (p.status === 'ON_HOLD') {
        progress = 30;
      } else {
        progress = 20;
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        deadline: p.deadline,
        status: p.status,
        progress,
        taskCount: pTasks.length,
      };
    });

    // 4. Compute Stats
    const openTasks = (tasks || []).filter((t) => t.status !== 'COMPLETED');
    const completedTasks = (tasks || []).filter((t) => t.status === 'COMPLETED');

    // 5. Milestones (deadlines from projects and major tasks)
    const milestones = [];
    formattedProjects.forEach((p) => {
      if (p.deadline) {
        milestones.push({
          id: `p-${p.id}`,
          title: `${p.name} Target`,
          date: p.deadline,
          type: 'Project',
        });
      }
    });
    (tasks || []).forEach((t) => {
      if (t.deadline && t.status !== 'COMPLETED') {
        milestones.push({
          id: `t-${t.id}`,
          title: t.title,
          date: t.deadline,
          type: 'Task',
        });
      }
    });
    milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 6. Recent activities related to lead's projects
    const { data: activities } = await supabase
      .from('activities')
      .select('id, action, description, created_at, user:users(id, name, avatar)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        projectCount: formattedProjects.length,
        teamMemberCount: distinctTeamMembers.length,
        openTasksCount: openTasks.length,
        completedTasksCount: completedTasks.length,
      },
      projects: formattedProjects,
      tasks: tasks || [],
      teamMembers: distinctTeamMembers,
      milestones: milestones.slice(0, 5),
      recentActivities: activities || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving lead dashboard', error: error.message });
  }
};

// 2. MY PROJECTS
export const getLeadProjects = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { teams, projectIds } = await getLeadScope(req.user.id);
    if (projectIds.length === 0) {
      return res.status(200).json({ success: true, projects: [], stats: { all: 0, active: 0, completed: 0, onHold: 0 } });
    }

    const { status, search } = req.query;

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

    const [{ data: projects, error }, { data: tasks }, { data: allTeams }] = await Promise.all([
      query,
      supabase.from('tasks').select('id, title, status, priority, deadline, project_id, assigned_to, assignee:users!tasks_assigned_to_fkey(id, name, avatar)').in('project_id', projectIds),
      supabase.from('teams').select('id, name, project_id').in('project_id', projectIds),
    ]);

    if (error) throw error;

    // Get team members for these teams
    const teamIdList = (allTeams || []).map((t) => t.id);
    const { data: rawMembers } = await supabase
      .from('team_members')
      .select('team_id, user:users(id, name, email, role, avatar, department)')
      .in('team_id', teamIdList);

    const formattedProjects = (projects || []).map((proj) => {
      const projTasks = (tasks || []).filter((t) => t.project_id === proj.id);
      const completedTasks = projTasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : (proj.status === 'COMPLETED' ? 100 : (proj.status === 'IN_PROGRESS' ? 60 : (proj.status === 'ON_HOLD' ? 30 : 20)));
      
      const projTeam = (allTeams || []).find((t) => t.project_id === proj.id);
      const projMembers = projTeam
        ? (rawMembers || []).filter((m) => m.team_id === projTeam.id && m.user).map((m) => m.user)
        : [];

      return {
        ...proj,
        progress,
        tasks: projTasks,
        taskCount: projTasks.length,
        completedTaskCount: completedTasks,
        team: projTeam ? { id: projTeam.id, name: projTeam.name, members: projMembers } : null,
      };
    });

    // Compute stats for all lead projects
    const { data: allLeadProjects } = await supabase.from('projects').select('id, status').in('id', projectIds);
    const stats = {
      all: (allLeadProjects || []).length,
      active: (allLeadProjects || []).filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length,
      completed: (allLeadProjects || []).filter((p) => p.status === 'COMPLETED').length,
      onHold: (allLeadProjects || []).filter((p) => p.status === 'ON_HOLD').length,
    };

    return res.status(200).json({ success: true, projects: formattedProjects, stats });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
};

// 3. MY TEAM
export const getLeadTeams = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { teams, projectIds, teamIds } = await getLeadScope(req.user.id);
    if (teamIds.length === 0) {
      return res.status(200).json({ success: true, teams: [], members: [] });
    }

    const [{ data: rawTeams }, { data: rawTeamMembers }, { data: tasks }, { data: projects }] = await Promise.all([
      supabase.from('teams').select('id, name, project_id, created_at').in('id', teamIds),
      supabase.from('team_members').select('team_id, user:users(id, name, email, role, department, avatar)').in('team_id', teamIds),
      supabase.from('tasks').select('id, title, status, project_id, assigned_to').in('project_id', projectIds),
      supabase.from('projects').select('id, name, status, deadline').in('id', projectIds),
    ]);

    // Build member analytics
    const memberMap = new Map();
    (rawTeamMembers || []).forEach((tm) => {
      if (!tm.user) return;
      const u = tm.user;
      if (!memberMap.has(u.id)) {
        const userTasks = (tasks || []).filter((t) => t.assigned_to === u.id);
        const completedCount = userTasks.filter((t) => t.status === 'COMPLETED').length;
        const progress = userTasks.length > 0 ? Math.round((completedCount / userTasks.length) * 100) : 0;

        memberMap.set(u.id, {
          ...u,
          assignedTasksCount: userTasks.length,
          completedTasksCount: completedCount,
          progress,
          teams: [],
        });
      }
      const existing = memberMap.get(u.id);
      const teamObj = (rawTeams || []).find((t) => t.id === tm.team_id);
      if (teamObj && !existing.teams.some((t) => t.id === teamObj.id)) {
        existing.teams.push({ id: teamObj.id, name: teamObj.name });
      }
    });

    const formattedTeams = (rawTeams || []).map((t) => {
      const proj = (projects || []).find((p) => p.id === t.project_id);
      const membersInTeam = (rawTeamMembers || [])
        .filter((tm) => tm.team_id === t.id && tm.user)
        .map((tm) => memberMap.get(tm.user.id));

      return {
        id: t.id,
        name: t.name,
        project: proj || null,
        members: membersInTeam,
        memberCount: membersInTeam.length,
      };
    });

    return res.status(200).json({
      success: true,
      teams: formattedTeams,
      members: Array.from(memberMap.values()),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving teams', error: error.message });
  }
};

// 4. PROJECT LEAD TASKS (Complete task management)
export const getLeadTasks = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { projectIds } = await getLeadScope(req.user.id);
    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        tasks: [],
        totalCount: 0,
        stats: { total: 0, todo: 0, inProgress: 0, completed: 0 },
      });
    }

    const { search, projectId, status, priority, assigneeId, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('tasks')
      .select(
        'id, title, description, priority, status, deadline, created_at, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, department)',
        { count: 'exact' }
      )
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    // Filters
    if (projectId && projectId !== 'ALL') {
      if (!projectIds.includes(projectId)) {
        return res.status(403).json({ message: 'Access denied: Selected project is not assigned to you.' });
      }
      query = query.eq('project_id', projectId);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    if (priority && priority !== 'ALL') {
      query = query.eq('priority', priority.toUpperCase());
    }

    if (assigneeId && assigneeId !== 'ALL') {
      if (assigneeId === 'UNASSIGNED') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', assigneeId);
      }
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data: tasks, count, error } = await query;
    if (error) throw error;

    // Compute stats for all lead's tasks
    const { data: allLeadTasks } = await supabase
      .from('tasks')
      .select('id, status')
      .in('project_id', projectIds);

    const stats = {
      total: (allLeadTasks || []).length,
      todo: (allLeadTasks || []).filter((t) => t.status === 'TODO').length,
      inProgress: (allLeadTasks || []).filter((t) => t.status === 'IN_PROGRESS').length,
      completed: (allLeadTasks || []).filter((t) => t.status === 'COMPLETED').length,
    };

    return res.status(200).json({
      success: true,
      tasks: tasks || [],
      totalCount: count || 0,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
};

export const getLeadTaskOptions = async (req, res) => {
  try {
    const { teams, projectIds, teamIds } = await getLeadScope(req.user.id);

    const [{ data: projects }, { data: rawTeamMembers }] = await Promise.all([
      supabase.from('projects').select('id, name, status').in('id', projectIds),
      supabase.from('team_members').select('team_id, user:users(id, name, email, role, avatar, department)').in('team_id', teamIds),
    ]);

    const memberMap = new Map();
    // Include the lead themselves as an option
    memberMap.set(req.user.id, {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department || 'Project Lead',
    });

    (rawTeamMembers || []).forEach((tm) => {
      if (tm.user && !memberMap.has(tm.user.id)) {
        memberMap.set(tm.user.id, tm.user);
      }
    });

    return res.status(200).json({
      success: true,
      projects: projects || [],
      members: Array.from(memberMap.values()),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving task options', error: error.message });
  }
};

export const createLeadTask = async (req, res) => {
  try {
    const { title, description = '', project_id, assigned_to, priority = 'MEDIUM', status = 'TODO', deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (!project_id) {
      return res.status(400).json({ message: 'Project is required' });
    }

    // Authorization check: Verify this project is assigned to this project lead!
    const { projectIds, teamIds } = await getLeadScope(req.user.id);
    if (!projectIds.includes(project_id)) {
      return res.status(403).json({
        message: 'Access denied: You are not authorized to create tasks for projects you do not lead.',
      });
    }

    // Permission check: Verify assigned_to is in this lead's team or is lead themselves!
    if (assigned_to) {
      const allowedAssignees = await getLeadAllowedAssigneeIds(req.user.id, teamIds);
      if (!allowedAssignees.has(assigned_to)) {
        return res.status(403).json({
          message: 'Access denied: You can only assign tasks to members of your assigned projects/teams.',
        });
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        project_id,
        assigned_to: assigned_to || null,
        priority: priority.toUpperCase(),
        status: status.toUpperCase(),
        deadline: deadline || null,
      })
      .select(
        'id, title, description, priority, status, deadline, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar)'
      )
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: 'CREATE_TASK',
      description: `Project Lead created task "${task.title}"`,
      project_id: task.project_id,
      task_id: task.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const updateLeadTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, project_id, assigned_to, priority, status, deadline } = req.body;

    // Fetch task to verify ownership
    const { data: existingTask, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, project_id, title')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Authorization check: Verify existing task project is led by this lead
    const { projectIds, teamIds } = await getLeadScope(req.user.id);
    if (!projectIds.includes(existingTask.project_id)) {
      return res.status(403).json({
        message: 'Access denied: You can only modify tasks belonging to projects you lead.',
      });
    }

    // If changing project_id, verify new project is also led by this lead
    if (project_id && !projectIds.includes(project_id)) {
      return res.status(403).json({
        message: 'Access denied: Cannot reassign task to a project you do not lead.',
      });
    }

    // If changing assigned_to, verify new assignee belongs to lead's teams or is lead
    if (assigned_to) {
      const allowedAssignees = await getLeadAllowedAssigneeIds(req.user.id, teamIds);
      if (!allowedAssignees.has(assigned_to)) {
        return res.status(403).json({
          message: 'Access denied: You can only assign tasks to members of your assigned projects/teams.',
        });
      }
    }

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (project_id !== undefined) updates.project_id = project_id;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (priority !== undefined) updates.priority = priority.toUpperCase();
    if (status !== undefined) updates.status = status.toUpperCase();
    if (deadline !== undefined) updates.deadline = deadline || null;

    const { data: updatedTask, error: updateErr } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(
        'id, title, description, priority, status, deadline, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar)'
      )
      .single();

    if (updateErr) throw updateErr;

    // Log Activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: updatedTask.status === 'COMPLETED' ? 'COMPLETE_TASK' : 'UPDATE_TASK',
      description: `Project Lead updated task "${updatedTask.title}"`,
      project_id: updatedTask.project_id,
      task_id: updatedTask.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const updateLeadTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, project_id, title')
      .eq('id', id)
      .maybeSingle();

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { projectIds } = await getLeadScope(req.user.id);
    if (!projectIds.includes(existingTask.project_id)) {
      return res.status(403).json({
        message: 'Access denied: You can only update tasks in projects you lead.',
      });
    }

    const newStatus = status.toUpperCase();
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        'id, title, description, priority, status, deadline, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar)'
      )
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: newStatus === 'COMPLETED' ? 'COMPLETE_TASK' : 'UPDATE_TASK_STATUS',
      description: `Project Lead marked task "${existingTask.title}" as ${newStatus.replace('_', ' ')}`,
      project_id: existingTask.project_id,
      task_id: existingTask.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task status updated',
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

export const deleteLeadTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingTask, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, title, project_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { projectIds } = await getLeadScope(req.user.id);
    if (!projectIds.includes(existingTask.project_id)) {
      return res.status(403).json({
        message: 'Access denied: You can only delete tasks belonging to projects you lead.',
      });
    }

    const { error: deleteErr } = await supabase.from('tasks').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    // Log activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: 'DELETE_TASK',
      description: `Project Lead deleted task "${existingTask.title}"`,
      project_id: existingTask.project_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// 5. PROJECT LEAD ACTIVITY
export const getLeadActivities = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const { projectIds } = await getLeadScope(req.user.id);
    if (projectIds.length === 0) {
      return res.status(200).json({
        success: true,
        activities: [],
        stats: { totalActivities: 0, activeMembers: 0, projectsUpdated: 0, tasksUpdated: 0 },
      });
    }

    const { category, days = '7', search } = req.query;

    let query = supabase
      .from('activities')
      .select('id, action, description, project_id, task_id, created_at, user:users(id, name, avatar, role)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    // Filter by category
    if (category && category !== 'ALL') {
      if (category === 'TASKS') {
        query = query.in('action', ['CREATE_TASK', 'UPDATE_TASK', 'UPDATE_TASK_STATUS', 'COMPLETE_TASK', 'DELETE_TASK']);
      } else if (category === 'PROJECTS') {
        query = query.in('action', ['CREATE_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT']);
      } else if (category === 'TEAM') {
        query = query.in('action', ['CREATE_TEAM', 'UPDATE_TEAM', 'DELETE_TEAM', 'ASSIGN_MEMBER', 'REMOVE_MEMBER']);
      }
    }

    // Filter by days
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

    // Compute stats for all lead activities
    const { data: allLeadActivities } = await supabase
      .from('activities')
      .select('id, action, user_id, project_id')
      .in('project_id', projectIds);

    const distinctUsers = new Set();
    const distinctProjects = new Set();
    let tasksCount = 0;

    (allLeadActivities || []).forEach((a) => {
      if (a.user_id) distinctUsers.add(a.user_id);
      if (a.project_id) distinctProjects.add(a.project_id);
      if (a.action && a.action.includes('TASK')) tasksCount++;
    });

    const stats = {
      totalActivities: (allLeadActivities || []).length,
      activeMembers: distinctUsers.size,
      projectsUpdated: distinctProjects.size,
      tasksUpdated: tasksCount,
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
