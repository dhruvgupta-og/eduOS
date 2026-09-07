import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { getUserSupabaseClient } from '../lib/supabaseUserClient';

const router = Router();

// GET /api/students - List students (RLS scoped to user)
router.get('/', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const userClient = getUserSupabaseClient(token);

  try {
    const { data, error } = await userClient
      .from('students')
      .select('*, classes(name, grade_level, section)')
      .order('full_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ students: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const userClient = getUserSupabaseClient(token);

  try {
    const { data, error } = await userClient
      .from('students')
      .select('*, classes(name, grade_level, section)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Student not found or access denied' });
    }

    return res.json({ student: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch student' });
  }
});

export default router;
