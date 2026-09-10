import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Initial tasks matching the reference UI if DB has no tasks
const INITIAL_TASKS = [
  {
    title: 'Design landing page',
    description: 'Create modern and responsive UI layouts for the club landing page.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    deadline: '2026-09-15T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
  {
    title: 'Set up authentication',
    description: 'Implement JWT token authentication and role-based access control.',
    priority: 'HIGH',
    status: 'TODO',
    deadline: '2026-09-18T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
  {
    title: 'Create database schema',
    description: 'Design Supabase tables and relationships for users, projects and tasks.',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    deadline: '2026-09-10T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
  {
    title: 'Build team management',
    description: 'Create team roster, role assignment, and project alignment modules.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    deadline: '2026-09-20T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
  {
    title: 'Write documentation',
    description: 'Draft API documentation and deployment guides for the platform.',
    priority: 'LOW',
    status: 'TODO',
    deadline: '2026-09-25T00:00:00.000Z',
    projectName: 'Hackathon 2026',
  },
  {
    title: 'Prepare demo video',
    description: 'Record a walkthrough demonstrating core features and member onboarding.',
    priority: 'MEDIUM',
    status: 'TODO',
    deadline: '2026-09-28T00:00:00.000Z',
    projectName: 'Social Media Campaign',
  },
  {
    title: 'Test and fix bugs',
    description: 'Conduct end-to-end integration testing and polish UI responsive layouts.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    deadline: '2026-10-02T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
  {
    title: 'Deploy to production',
    description: 'Deploy the latest release candidate to production environment.',
    priority: 'MEDIUM',
    status: 'TODO',
    deadline: '2026-10-05T00:00:00.000Z',
    projectName: 'Website Redesign',
  },
];

// Helper to seed initial tasks if table is empty
const ensureInitialTasks = async () => {
  if (!isSupabaseConfigured()) return;
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (!error && count === 0) {
      // Get existing projects and users to link
      const [{ data: projects }, { data: users }] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('users').select('id, name'),
      ]);

      if (projects && projects.length > 0) {
        const defaultProjectId = projects[0].id;
        const defaultUserId = users && users.length > 0 ? users[0].id : null;

        for (let i = 0; i < INITIAL_TASKS.length; i++) {
          const item = INITIAL_TASKS[i];
          const matchedProject = projects.find(
            (p) => p.name.toLowerCase() === item.projectName.toLowerCase()
          );
          const assignedUser = users && users.length > 0 ? users[i % users.length].id : defaultUserId;

          await supabase.from('tasks').insert({
            title: item.title,
            description: item.description,
            project_id: matchedProject ? matchedProject.id : defaultProjectId,
            assigned_to: assignedUser,
            priority: item.priority,
            status: item.status,
            deadline: item.deadline,
          });
        }
      }
    }
  } catch (err) {
    console.error('Initial tasks check failed:', err.message);
  }
};

export const getTasks = async (req, res) => {
  try {
    const {
      search = '',
      projectId = '',
      status = '',
      priority = '',
      assigneeId = '',
      page = 1,
      limit = 8,
    } = req.query;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    await ensureInitialTasks();

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('tasks')
      .select(
        'id, title, description, priority, status, deadline, created_at, updated_at, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, role)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (projectId && projectId !== 'ALL') {
      query = query.eq('project_id', projectId);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    if (priority && priority !== 'ALL') {
      query = query.eq('priority', priority.toUpperCase());
    }

    if (assigneeId && assigneeId !== 'ALL') {
      query = query.eq('assigned_to', assigneeId);
    }

    query = query.range(offset, offset + limitNum - 1);

    const { data: tasks, count: totalFiltered, error } = await query;
    if (error) throw error;

    // Compute stats
    const [
      { count: totalCount },
      { count: todoCount },
      { count: inProgressCount },
      { count: completedCount },
    ] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'TODO'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    ]);

    return res.status(200).json({
      success: true,
      tasks: tasks || [],
      totalCount: totalFiltered || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((totalFiltered || 0) / limitNum) || 1,
      stats: {
        total: totalCount || 0,
        todo: todoCount || 0,
        inProgress: inProgressCount || 0,
        completed: completedCount || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
};

export const getTaskOptions = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const [{ data: projects, error: pErr }, { data: members, error: mErr }] = await Promise.all([
      supabase.from('projects').select('id, name, status').order('name', { ascending: true }),
      supabase.from('users').select('id, name, email, role, avatar, status').order('name', { ascending: true }),
    ]);

    if (pErr) throw pErr;
    if (mErr) throw mErr;

    return res.status(200).json({
      success: true,
      projects: projects || [],
      members: members || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving task options', error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description = '', project_id, assigned_to, priority = 'MEDIUM', status = 'TODO', deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!project_id) {
      return res.status(400).json({ message: 'Project is required' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

    const taskPriority = validPriorities.includes(priority?.toUpperCase()) ? priority.toUpperCase() : 'MEDIUM';
    const taskStatus = validStatuses.includes(status?.toUpperCase()) ? status.toUpperCase() : 'TODO';

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        project_id,
        assigned_to: assigned_to || null,
        priority: taskPriority,
        status: taskStatus,
        deadline: deadline || null,
      })
      .select('id, title, description, priority, status, deadline, created_at, updated_at, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, role)')
      .single();

    if (error) throw error;

    // Log Activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'CREATE_TASK',
        description: `Created task "${task.title}"`,
        project_id: task.project_id || null,
        task_id: task.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, project_id, assigned_to, priority, status, deadline } = req.body;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (project_id !== undefined) updates.project_id = project_id;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (priority !== undefined) updates.priority = priority.toUpperCase();
    if (status !== undefined) updates.status = status.toUpperCase();
    if (deadline !== undefined) updates.deadline = deadline || null;

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('id, title, description, priority, status, deadline, created_at, updated_at, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, role)')
      .single();

    if (error) throw error;

    // Log Activity
    if (req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'UPDATE_TASK',
        description: `Updated task "${updatedTask.title}"`,
        project_id: updatedTask.project_id || null,
        task_id: updatedTask.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
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

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update({
        status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, title, description, priority, status, deadline, created_at, updated_at, project_id, assigned_to, project:projects(id, name), assignee:users!tasks_assigned_to_fkey(id, name, email, avatar, role)')
      .single();

    if (error) throw error;

    if (req.user?.id) {
      const actionName = status === 'COMPLETED' ? 'COMPLETE_TASK' : 'UPDATE_TASK_STATUS';
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: actionName,
        description: status === 'COMPLETED'
          ? `Completed task "${updatedTask.title}"`
          : `Moved task "${updatedTask.title}" to ${status.replace('_', ' ')}`,
        project_id: updatedTask.project_id || null,
        task_id: updatedTask.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // Get task before delete to log activity
    const { data: task } = await supabase
      .from('tasks')
      .select('id, title, project_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    if (task && req.user?.id) {
      await supabase.from('activities').insert({
        user_id: req.user.id,
        action: 'DELETE_TASK',
        description: `Deleted task "${task.title}"`,
        project_id: task.project_id || null,
        task_id: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};
