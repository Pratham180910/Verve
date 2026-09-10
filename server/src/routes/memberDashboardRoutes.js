import express from 'express';
import {
  getMemberDashboard,
  getMemberTasks,
  updateMemberTaskStatus,
  getMemberProjects,
  getMemberTeams,
  getMemberActivities,
  updateMemberProfile,
  blockMemberAction,
} from '../controllers/memberDashboardController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All member dashboard routes require authenticated MEMBER
router.use(protect);
router.use(requireRole('MEMBER'));

// Read & Allowed Member Actions
router.get('/dashboard', getMemberDashboard);
router.get('/tasks', getMemberTasks);
router.patch('/tasks/:id/status', updateMemberTaskStatus);
router.get('/projects', getMemberProjects);
router.get('/teams', getMemberTeams);
router.get('/activities', getMemberActivities);
router.put('/profile', updateMemberProfile);

// Explicit 403 Forbidden for unauthorized member actions
router.post('/tasks', blockMemberAction('create or assign tasks'));
router.delete('/tasks/:id', blockMemberAction('delete tasks'));
router.put('/tasks/:id', blockMemberAction('edit tasks'));
router.post('/projects', blockMemberAction('create projects'));
router.delete('/projects/:id', blockMemberAction('delete projects'));
router.put('/projects/:id', blockMemberAction('modify projects'));
router.post('/teams', blockMemberAction('create teams'));
router.delete('/teams/:id', blockMemberAction('delete teams'));
router.put('/teams/:id', blockMemberAction('manage teams'));

export default router;
