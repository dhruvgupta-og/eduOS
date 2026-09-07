import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { requireRole } from '../middleware/requireRole';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import crypto from 'crypto';

const router = Router();

router.post('/staff', authenticateRequest, requireRole(['principal', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const auth = req.auth!;
  const {
    name,
    email,
    phone = '',
    role = 'teacher',
    designation = 'Teacher',
    department = 'General'
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields: name and email are required.' });
  }

  // Strictly enforce server-side school_id from authenticated profile
  const targetSchoolId = auth.school_id;
  if (!targetSchoolId) {
    return res.status(400).json({ error: 'Authenticated caller does not belong to any school.' });
  }

  const admin = getSupabaseAdmin();
  const staffId = crypto.randomUUID();
  const tempPassword = `EduOS-${crypto.randomBytes(4).toString('hex').toUpperCase()}!${crypto.randomInt(10, 99)}`;

  try {
    // 1. Create Supabase Auth user
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role === 'principal' ? 'principal' : 'teacher',
        school_id: targetSchoolId
      }
    });

    if (authErr || !authUser?.user) {
      return res.status(500).json({ error: 'Failed to create staff in Auth: ' + (authErr?.message || 'Unknown Auth error') });
    }

    // 2. Create Staff row
    const { data: staff, error: staffErr } = await admin
      .from('staff')
      .insert([
        {
          id: staffId,
          school_id: targetSchoolId,
          employee_id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          name,
          email: email.toLowerCase().trim(),
          role: role === 'principal' ? 'principal' : 'teacher',
          department: department || designation || 'General',
          phone: phone || '',
          joining_date: new Date().toISOString().split('T')[0],
          subjects: [],
          status: 'active'
        }
      ])
      .select()
      .single();

    if (staffErr) {
      return res.status(500).json({ error: 'Failed to create staff record: ' + staffErr.message });
    }

    // 3. Optional Profile row
    try {
      await admin.from('profiles').insert([
        {
          id: authUser.user.id,
          school_id: targetSchoolId,
          role: role === 'principal' ? 'principal' : 'teacher',
          full_name: name,
          email: email.toLowerCase().trim(),
          phone
        }
      ]);
    } catch {
      // ignore
    }

    return res.json({
      success: true,
      message: 'Staff member provisioned successfully',
      staff,
      credentials: {
        id: authUser.user.id,
        email: email.toLowerCase().trim(),
        fullName: name,
        role: role === 'principal' ? 'principal' : 'teacher',
        password: tempPassword
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal staff provisioning error' });
  }
});

export default router;
