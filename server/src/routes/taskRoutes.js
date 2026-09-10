import express from 'express';
import {
  getTasks,
  getTaskOptions,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only authorization
router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/options', getTaskOptions);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
