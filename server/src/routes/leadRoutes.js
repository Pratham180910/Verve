import express from 'express';
import {
  getLeadDashboard,
  getLeadProjects,
  getLeadTeams,
  getLeadTasks,
  getLeadTaskOptions,
  createLeadTask,
  updateLeadTask,
  updateLeadTaskStatus,
  deleteLeadTask,
  getLeadActivities,
} from '../controllers/leadController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lead authorization required for all endpoints
router.use(protect);
router.use(requireRole('PROJECT_LEAD'));

router.get('/dashboard', getLeadDashboard);
router.get('/projects', getLeadProjects);
router.get('/teams', getLeadTeams);
router.get('/tasks', getLeadTasks);
router.get('/task-options', getLeadTaskOptions);
router.post('/tasks', createLeadTask);
router.put('/tasks/:id', updateLeadTask);
router.patch('/tasks/:id/status', updateLeadTaskStatus);
router.delete('/tasks/:id', deleteLeadTask);
router.get('/activities', getLeadActivities);

export default router;
