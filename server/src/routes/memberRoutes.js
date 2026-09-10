import express from 'express';
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/memberController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All member management routes require authenticated ADMIN
router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/', getMembers);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
