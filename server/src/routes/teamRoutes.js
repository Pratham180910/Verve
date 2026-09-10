import express from 'express';
import {
  getTeams,
  getTeamOptions,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/teamController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce ADMIN authentication for all team operations
router.use(protect, requireRole('ADMIN'));

router.get('/', getTeams);
router.get('/options', getTeamOptions);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
