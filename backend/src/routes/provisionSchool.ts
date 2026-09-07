import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { requireRole } from '../middleware/requireRole';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import crypto from 'crypto';

const router = Router();

router.post('/school', authenticateRequest, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    slug,
    brand_color = '#2563eb',
    principalName,
    principalEmail,
    principalPhone = '',
    feature_flags = { attendance: true, fees: true, homework: true, announcements: true }
  } = req.body;

  if (!name || !slug || !principalName || !principalEmail) {
    return res.status(400).json({ error: 'Missing required fields: name, slug, principalName, and principalEmail are required.' });
  }

  const admin = getSupabaseAdmin();
  const schoolId = crypto.randomUUID();
  const tempPassword = `EduOS-${crypto.randomBytes(4).toString('hex').toUpperCase()}!${crypto.randomInt(10, 99)}`;

  try {
    // 1. Create School in public.schools
    const { data: school, error: schErr } = await admin
      .from('schools')
      .insert([
        {
          id: schoolId,
          name,
          code: (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).toLowerCase().trim(),
          brand_color,
          feature_flags
        }
      ])
      .select()
      .single();

    if (schErr) {
      return res.status(500).json({ error: 'Failed to create school: ' + schErr.message });
    }

    // 2. Create Principal user in Supabase Auth
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: principalEmail.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: principalName,
        role: 'principal',
        school_id: schoolId
      }
    });

    if (authErr || !authUser?.user) {
      // Rollback school if auth creation failed
      await admin.from('schools').delete().eq('id', schoolId);
      return res.status(500).json({ error: 'Failed to create principal user in Auth: ' + (authErr?.message || 'Unknown Auth error') });
    }

    // 3. Create Principal in public.staff
    try {
      await admin.from('staff').insert([
        {
          id: crypto.randomUUID(),
          school_id: schoolId,
          employee_id: `PRIN-${Math.floor(100 + Math.random() * 900)}`,
          name: principalName,
          email: principalEmail.toLowerCase().trim(),
          role: 'principal',
          department: 'Administration',
          phone: principalPhone || '',
          joining_date: new Date().toISOString().split('T')[0],
          status: 'active'
        }
      ]);
    } catch (e) {
      console.warn('Optional staff insert warning:', e);
    }

    // 4. Create Principal in public.profiles if table exists
    try {
      await admin.from('profiles').insert([
        {
          id: authUser.user.id,
          school_id: schoolId,
          role: 'principal',
          full_name: principalName,
          email: principalEmail.toLowerCase().trim(),
          phone: principalPhone
        }
      ]);
    } catch {
      // Ignore if profiles table is not present
    }

    return res.json({
      success: true,
      message: 'School and Principal successfully provisioned',
      school,
      principal: {
        id: authUser.user.id,
        school_id: schoolId,
        full_name: principalName,
        email: principalEmail.toLowerCase().trim(),
        role: 'principal',
        tempPassword
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal provisioning error' });
  }
});

export default router;
