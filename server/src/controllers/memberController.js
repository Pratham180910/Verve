import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Seeded in-memory members matching the reference UI for development/offline mode
let DEV_MEMBERS = [
  {
    id: 'mem_1',
    name: 'Ayan Patel',
    email: 'ayan.patel@verveclub.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Core Team',
    projectCount: 4,
    teamCount: 3,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-01-12'),
  },
  {
    id: 'mem_2',
    name: 'Priya Sharma',
    email: 'priya.sharma@verveclub.edu',
    role: 'PROJECT_LEAD',
    status: 'ACTIVE',
    department: 'Design',
    projectCount: 3,
    teamCount: 2,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'mem_3',
    name: 'Rahul Khan',
    email: 'rahul.khan@verveclub.edu',
    role: 'PROJECT_LEAD',
    status: 'ACTIVE',
    department: 'Development',
    projectCount: 2,
    teamCount: 2,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-01-18'),
  },
  {
    id: 'mem_4',
    name: 'Neha Singh',
    email: 'neha.singh@verveclub.edu',
    role: 'MEMBER',
    status: 'ACTIVE',
    department: 'Content & Media',
    projectCount: 2,
    teamCount: 1,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-02-01'),
  },
  {
    id: 'mem_5',
    name: 'Arjun Sinha',
    email: 'arjun.sinha@verveclub.edu',
    role: 'MEMBER',
    status: 'ACTIVE',
    department: 'Web Development',
    projectCount: 1,
    teamCount: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-02-03'),
  },
  {
    id: 'mem_6',
    name: 'Kavya Mehta',
    email: 'kavya.mehta@verveclub.edu',
    role: 'MEMBER',
    status: 'ACTIVE',
    department: 'Design',
    projectCount: 2,
    teamCount: 1,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-02-05'),
  },
  {
    id: 'mem_7',
    name: 'Rohan Verma',
    email: 'rohan.verma@verveclub.edu',
    role: 'MEMBER',
    status: 'INACTIVE',
    department: 'Logistics',
    projectCount: 1,
    teamCount: 1,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-01-20'),
  },
  {
    id: 'mem_8',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@verveclub.edu',
    role: 'MEMBER',
    status: 'PENDING',
    department: 'Public Relations',
    projectCount: 0,
    teamCount: 0,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date('2025-03-01'),
  },
];

export const getMembers = async (req, res) => {
  try {
    const { search = '', role = '', status = '' } = req.query;

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('users')
        .select('id, name, email, role, status, department, avatar, created_at')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (role && role !== 'ALL') {
        query = query.eq('role', role.toUpperCase());
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status.toUpperCase());
      }

      const { data: users, error } = await query;
      if (error) throw error;

      const [
        { count: totalMembers },
        { count: activeMembers },
        { count: pendingMembers },
        { count: projectLeads },
        { count: adminCount },
        { count: memberCount },
        { count: inactiveCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'PROJECT_LEAD'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'MEMBER').eq('status', 'ACTIVE'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVE'),
      ]);

      const formattedMembers = (users || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'ACTIVE',
        department: u.department || '',
        avatar: u.avatar || '',
        projectCount: 0,
        teamCount: 0,
        createdAt: u.created_at,
      }));

      return res.status(200).json({
        success: true,
        stats: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          pendingMembers: pendingMembers || 0,
          projectLeads: projectLeads || 0,
          adminCount: adminCount || 0,
          memberCount: memberCount || 0,
          inactiveCount: inactiveCount || 0,
        },
        members: formattedMembers,
      });
    }

    // Dev Fallback
    let filtered = [...DEV_MEMBERS];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }
    if (role && role !== 'ALL') {
      filtered = filtered.filter((m) => m.role === role.toUpperCase());
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter((m) => m.status === status.toUpperCase());
    }

    const totalMembers = DEV_MEMBERS.length;
    const activeMembers = DEV_MEMBERS.filter((m) => (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const pendingMembers = DEV_MEMBERS.filter((m) => (m.status || '').toUpperCase() === 'PENDING').length;
    const projectLeads = DEV_MEMBERS.filter((m) => (m.role || '').toUpperCase() === 'PROJECT_LEAD').length;
    const adminCount = DEV_MEMBERS.filter((m) => (m.role || '').toUpperCase() === 'ADMIN').length;
    const memberCount = DEV_MEMBERS.filter((m) => (m.role || '').toUpperCase() === 'MEMBER' && (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const inactiveCount = DEV_MEMBERS.filter((m) => (m.status || '').toUpperCase() === 'INACTIVE').length;

    return res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        projectLeads,
        adminCount,
        memberCount,
        inactiveCount,
      },
      members: filtered,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving members', error: error.message });
  }
};

export const createMember = async (req, res) => {
  try {
    const { name, email, role, password, department, status = 'ACTIVE' } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: 'Please provide name, email, role, and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          email: cleanEmail,
          role: role.toUpperCase(),
          password: hashedPassword,
          department: department ? department.trim() : '',
          status: status.toUpperCase(),
        })
        .select('id, name, email, role, status, department, created_at')
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        member: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          projectCount: 0,
          teamCount: 0,
          createdAt: user.created_at,
        },
      });
    }

    // Dev Fallback
    const existing = DEV_MEMBERS.find((m) => m.email === cleanEmail);
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newMember = {
      id: `mem_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: role.toUpperCase(),
      status: status.toUpperCase(),
      department: department ? department.trim() : '',
      projectCount: 0,
      teamCount: 0,
      password: hashedPassword,
      createdAt: new Date(),
    };

    DEV_MEMBERS.unshift(newMember);

    const { password: _, ...safeMember } = newMember;
    return res.status(201).json({
      success: true,
      member: safeMember,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating member', error: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, status } = req.body;

    if (isSupabaseConfigured()) {
      const updates = { updated_at: new Date().toISOString() };
      if (name) updates.name = name.trim();
      if (email) updates.email = email.toLowerCase().trim();
      if (role) updates.role = role.toUpperCase();
      if (department !== undefined) updates.department = department.trim();
      if (status) updates.status = status.toUpperCase();

      const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, name, email, role, status, department, created_at')
        .maybeSingle();

      if (error) throw error;
      if (!user) {
        return res.status(404).json({ message: 'Member not found' });
      }

      return res.status(200).json({
        success: true,
        member: user,
      });
    }

    // Dev Fallback
    const memberIndex = DEV_MEMBERS.findIndex((m) => m.id === id);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const member = DEV_MEMBERS[memberIndex];
    if (name) member.name = name.trim();
    if (email) member.email = email.toLowerCase().trim();
    if (role) member.role = role.toUpperCase();
    if (department !== undefined) member.department = department.trim();
    if (status) member.status = status.toUpperCase();

    DEV_MEMBERS[memberIndex] = member;

    return res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating member', error: error.message });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent Admin from deleting self
    if (req.user && (req.user.id === id || req.user._id === id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ message: 'Member not found' });
      }

      return res.status(200).json({ success: true, message: 'Member removed successfully' });
    }

    // Dev Fallback
    const initialLen = DEV_MEMBERS.length;
    DEV_MEMBERS = DEV_MEMBERS.filter((m) => m.id !== id);
    if (DEV_MEMBERS.length === initialLen) {
      return res.status(404).json({ message: 'Member not found' });
    }

    return res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};
