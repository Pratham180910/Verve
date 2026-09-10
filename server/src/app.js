import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import memberDashboardRoutes from './routes/memberDashboardRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Club Management System API is healthy' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes (protected, ADMIN only)
app.use('/api/admin', adminRoutes);
app.use('/api/admin/members', memberRoutes);
app.use('/api/admin/projects', projectRoutes);
app.use('/api/admin/teams', teamRoutes);
app.use('/api/admin/tasks', taskRoutes);
app.use('/api/admin/activities', activityRoutes);

// Role-based routes (protected, role-enforced)
app.use('/api/lead', leadRoutes);
app.use('/api/member', memberDashboardRoutes);

export default app;
