import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

const router = Router();

router.post('/reset-password', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const auth = req.auth!;
  const { userId, newPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing target user ID for reset' });
  }

  const generatedPassword = newPassword || `EduOS-${Math.random().toString(36).slice(-8).toUpperCase()}!`;

  const admin = getSupabaseAdmin();
  try {
    // 1. Fetch profile of the user to reset to verify school_id tenancy checks
    const { data: targetProfile, error: profErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profErr || !targetProfile) {
      return res.status(404).json({ error: 'Target user profile not found for password reset validation' });
    }

    // 2. Security Enforcements:
    // Super Admin can reset anybody
    // Principal (admin) can reset users in their own school
    // Teacher can only reset parents or students in their own school
    if (auth.role !== 'super_admin') {
      if (targetProfile.school_id !== auth.school_id) {
        return res.status(403).json({ error: 'Access denied: Target user is in a different school tenant' });
      }

      if (auth.role === 'teacher' && targetProfile.role !== 'parent' && targetProfile.role !== 'student') {
        return res.status(403).json({ error: 'Access denied: Teachers can only reset student or parent credentials' });
      }
    }

    // 3. Perform Password Reset using admin client
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password: generatedPassword
    });

    if (updateErr) {
      return res.status(500).json({ error: 'Failed to reset password: ' + updateErr.message });
    }

    return res.json({
      success: true,
      message: 'Password reset successfully',
      email: targetProfile.email,
      name: targetProfile.full_name,
      newPassword: generatedPassword
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server-side password reset error' });
  }
});

export default router;
