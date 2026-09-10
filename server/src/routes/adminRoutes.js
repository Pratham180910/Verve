import express from 'express';
import {
  getDashboardSummary,
  getClubProfile,
  updateClubProfile,
  getDataStats,
  exportClubData,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/dashboard', getDashboardSummary);
router.get('/settings/club-profile', getClubProfile);
router.put('/settings/club-profile', updateClubProfile);
router.get('/settings/data-stats', getDataStats);
router.get('/settings/export', exportClubData);

export default router;

