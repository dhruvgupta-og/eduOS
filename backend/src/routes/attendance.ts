import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { getUserSupabaseClient } from '../lib/supabaseUserClient';

const router = Router();

// GET /api/attendance - Fetch attendance records
router.get('/', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const userClient = getUserSupabaseClient(token);
  const { date, classId } = req.query;

  try {
    let query = userClient.from('attendance').select('*, students(full_name, admission_number, roll_number)');

    if (date) {
      query = query.eq('date', date as string);
    }
    if (classId) {
      query = query.eq('class_id', classId as string);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ attendance: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch attendance' });
  }
});

// POST /api/attendance/batch - Record or update batch attendance
router.post('/batch', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const userClient = getUserSupabaseClient(token);
  const auth = req.auth!;
  const { records } = req.body; // Array of { student_id, class_id, date, status }

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array is required' });
  }

  const formatted = records.map((r: any) => ({
    school_id: auth.school_id,
    student_id: r.student_id,
    class_id: r.class_id,
    date: r.date || new Date().toISOString().split('T')[0],
    status: r.status,
    recorded_by: auth.id
  }));

  try {
    const { data, error } = await userClient
      .from('attendance')
      .upsert(formatted, { onConflict: 'student_id,date' })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, count: data?.length || 0, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to record attendance' });
  }
});

export default router;
