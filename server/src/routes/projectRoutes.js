import express from 'express';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce ADMIN authentication for all project operations
router.use(protect, requireRole('ADMIN'));

router.get('/', getProjects);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
