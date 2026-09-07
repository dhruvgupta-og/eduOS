import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/authenticateRequest';
import { requireRole } from '../middleware/requireRole';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import crypto from 'crypto';

const router = Router();

const handler = async (req: AuthenticatedRequest, res: Response) => {
  const auth = req.auth!;
  const {
    studentName,
    admissionNo,
    rollNo = '',
    classId,
    parentName,
    parentEmail,
    parentPhone = '',
    createStudentLogin = false,
    studentEmail = ''
  } = req.body;

  if (!studentName || !admissionNo || !parentName || !parentEmail) {
    return res.status(400).json({
      error: 'Missing required fields: studentName, admissionNo, parentName, and parentEmail are required.'
    });
  }

  // Strictly enforce caller's school_id server-side
  const targetSchoolId = auth.school_id;
  if (!targetSchoolId) {
    return res.status(400).json({ error: 'Authenticated caller does not belong to any school.' });
  }

  const admin = getSupabaseAdmin();
  const parentTempPassword = `EduOS-${crypto.randomBytes(4).toString('hex').toUpperCase()}!${crypto.randomInt(10, 99)}`;
  const studentTempPassword = `EduOS-${crypto.randomBytes(4).toString('hex').toUpperCase()}!${crypto.randomInt(10, 99)}`;
  const studentId = crypto.randomUUID();

  try {
    // 1. Create Parent in Supabase Auth
    const { data: parentUser, error: parentAuthErr } = await admin.auth.admin.createUser({
      email: parentEmail.toLowerCase().trim(),
      password: parentTempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: parentName,
        role: 'parent',
        school_id: targetSchoolId
      }
    });

    if (parentAuthErr || !parentUser?.user) {
      return res.status(500).json({ error: 'Failed to create parent in Auth: ' + (parentAuthErr?.message || 'Unknown Auth error') });
    }

    // 2. Optional Parent Profile
    try {
      await admin.from('profiles').insert([
        {
          id: parentUser.user.id,
          school_id: targetSchoolId,
          role: 'parent',
          full_name: parentName,
          email: parentEmail.toLowerCase().trim(),
          phone: parentPhone
        }
      ]);
    } catch {
      // ignore
    }

    // 3. Optional: Create Student Login
    let studentAuthUserId: string | null = null;
    let studentEffectiveEmail: string | null = null;
    if (createStudentLogin && (studentEmail || admissionNo)) {
      studentEffectiveEmail = (studentEmail || `student.${admissionNo.toLowerCase()}@eduos.school`).toLowerCase().trim();
      const { data: stdUser, error: stdAuthErr } = await admin.auth.admin.createUser({
        email: studentEffectiveEmail,
        password: studentTempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: studentName,
          role: 'student',
          school_id: targetSchoolId
        }
      });

      if (!stdAuthErr && stdUser?.user) {
        studentAuthUserId = stdUser.user.id;
        try {
          await admin.from('profiles').insert([
            {
              id: studentAuthUserId,
              school_id: targetSchoolId,
              role: 'student',
              full_name: studentName,
              email: studentEffectiveEmail,
              phone: ''
            }
          ]);
        } catch {
          // ignore
        }
      }
    }

    // 4. Create Student record in public.students
    const { data: student, error: stdErr } = await admin
      .from('students')
      .insert([
        {
          id: studentId,
          school_id: targetSchoolId,
          class_id: classId || null,
          admission_no: admissionNo,
          roll_no: rollNo || '01',
          name: studentName,
          email: studentEffectiveEmail || '',
          parent_name: parentName,
          parent_phone: parentPhone || '',
          parent_email: parentEmail.toLowerCase().trim(),
          status: 'active'
        }
      ])
      .select()
      .single();

    if (stdErr) {
      return res.status(500).json({ error: 'Failed to create student record: ' + stdErr.message });
    }

    return res.json({
      success: true,
      message: 'Student and Parent provisioned successfully',
      student,
      parentCredentials: {
        id: parentUser.user.id,
        email: parentEmail.toLowerCase().trim(),
        fullName: parentName,
        role: 'parent',
        password: parentTempPassword
      },
      studentCredentials: studentAuthUserId ? {
        id: studentAuthUserId,
        email: studentEffectiveEmail,
        fullName: studentName,
        role: 'student',
        password: studentTempPassword
      } : null
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal student provisioning error' });
  }
};

router.post('/student', authenticateRequest, requireRole(['teacher', 'principal', 'super_admin']), handler);
router.post('/student-parent', authenticateRequest, requireRole(['teacher', 'principal', 'super_admin']), handler);

export default router;
