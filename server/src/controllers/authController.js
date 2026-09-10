import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        message: 'Database connection unavailable. Please ensure Supabase is configured in .env and seeded.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        department: req.user.department,
        createdAt: req.user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving user profile', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    // Fetch current user with password hash
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, password')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password using existing bcrypt implementation
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activities').insert({
      user_id: req.user.id,
      action: 'UPDATE_PASSWORD',
      description: `User "${user.name}" updated their account password`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    const [
      { count: activeMembersCount },
      { count: completedProjectsCount },
      { data: allProjects },
      { data: allTasks },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('projects').select('id, status'),
      supabase.from('tasks').select('id, status, assigned_to, project_id'),
    ]);

    const totalProjects = (allProjects || []).length;
    const tasks = allTasks || [];
    const totalTasks = tasks.length;

    // Calculate community-driven percentage from real projects & tasks data
    const projectsWithTasks = new Set(tasks.map((t) => t.project_id).filter(Boolean));
    const projectEngagement = totalProjects > 0 ? projectsWithTasks.size / totalProjects : 0;
    
    const assignedTasks = tasks.filter((t) => t.assigned_to).length;
    const taskAssignmentRate = totalTasks > 0 ? assignedTasks / totalTasks : 0;

    const communityDrivenRate = totalProjects > 0
      ? Math.round(((projectEngagement + (taskAssignmentRate || 1)) / 2) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        activeMembers: activeMembersCount || 0,
        completedProjects: completedProjectsCount || 0,
        communityDriven: communityDrivenRate,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve stats', error: error.message });
  }
};


