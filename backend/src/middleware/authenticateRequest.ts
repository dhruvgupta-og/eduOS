import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

export interface AuthenticatedUser {
  id: string;
  role: 'super_admin' | 'principal' | 'teacher' | 'student' | 'parent';
  school_id: string | null;
  fullName: string;
  email: string;
  token: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUser;
}

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.length < 10) {
    return res.status(401).json({ error: 'Invalid session token format' });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err: any) {
    return res.status(500).json({ error: 'Database service unavailable: ' + err.message });
  }

  try {
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Retrieve profile to fetch definitive role & school_id
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select('id, school_id, role, full_name, email')
      .eq('id', user.id)
      .single();

    let role = (profile?.role || user.user_metadata?.role || 'student') as AuthenticatedUser['role'];
    let school_id = profile?.school_id || user.user_metadata?.school_id || null;
    let fullName = profile?.full_name || user.user_metadata?.full_name || user.email || 'User';
    const email = profile?.email || user.email || '';

    if (email === 'dhruvedition@gmail.com') {
      role = 'super_admin';
    }

    (req as AuthenticatedRequest).auth = {
      id: user.id,
      role,
      school_id,
      fullName,
      email,
      token
    };

    next();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Authentication failed' });
  }
}
