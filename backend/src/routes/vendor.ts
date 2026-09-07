import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { requireRole } from '../middleware/requireRole';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

const router = Router();

// Strict Vendor Route Guard: Super Admin ONLY
router.use(authenticateRequest);
router.use(requireRole(['super_admin']));

/**
 * GET /api/vendor/schools
 * List all provisioned schools across the multi-tenant platform
 */
router.get('/schools', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = getSupabaseAdmin();
    const { data: schools, error } = await admin
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, schools: schools || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch vendor schools' });
  }
});

/**
 * PATCH /api/vendor/schools/:id/features
 * Toggle or update feature flags for a tenant
 */
router.patch('/schools/:id/features', async (req: AuthenticatedRequest, res: Response) => {
  const { feature_flags } = req.body;
  if (!feature_flags || typeof feature_flags !== 'object') {
    return res.status(400).json({ error: 'feature_flags object is required' });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('schools')
      .update({ feature_flags })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, school: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update feature flags' });
  }
});

/**
 * GET /api/vendor/system-metrics
 * Global platform telemetry for super_admin
 */
router.get('/system-metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = getSupabaseAdmin();
    const { count: totalSchools } = await admin.from('schools').select('*', { count: 'exact', head: true });
    const { count: totalUsers } = await admin.from('profiles').select('*', { count: 'exact', head: true });

    return res.json({
      success: true,
      metrics: {
        totalSchools: totalSchools || 0,
        totalUsers: totalUsers || 0,
        serverUptimeSeconds: Math.floor(process.uptime()),
        dbEngine: 'Supabase PostgreSQL (RFC-4122 UUID)',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (err: any) {
    return res.json({
      success: true,
      metrics: {
        totalSchools: 0,
        totalUsers: 0,
        serverUptimeSeconds: Math.floor(process.uptime()),
        dbEngine: 'Supabase PostgreSQL',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
});

export default router;
