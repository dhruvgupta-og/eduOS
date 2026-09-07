import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { getUserSupabaseClient } from '../lib/supabaseUserClient';

const router = Router();

// GET /api/announcements - Fetch announcements (RLS filtered)
router.get('/', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const userClient = getUserSupabaseClient(token);

  try {
    const { data, error } = await userClient
      .from('announcements')
      .select('*, profiles:created_by(full_name, role)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ announcements: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch announcements' });
  }
});

// POST /api/announcements - Create new announcement
router.post('/', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.auth!.token;
  const auth = req.auth!;
  const userClient = getUserSupabaseClient(token);
  const { title, content, target_role = 'all' } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const { data, error } = await userClient
      .from('announcements')
      .insert([
        {
          school_id: auth.school_id,
          title,
          content,
          target_role,
          created_by: auth.id
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, announcement: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create announcement' });
  }
});

export default router;
