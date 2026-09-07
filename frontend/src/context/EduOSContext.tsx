import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  School,
  Profile,
  Student,
  Staff,
  ClassRoom,
  AttendanceRecord,
  FeeStructure,
  FeePayment,
  Announcement,
  Homework,
  HomeworkSubmission,
  Role,
  AttendanceStatus,
} from '../types';

interface EduOSContextType {
  // Auth state & actions
  session: any | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; role?: Role; error?: string }>;

  // Tenancy & Profile
  schools: School[];
  currentSchoolId: string | null;
  currentSchool: School | null;
  currentRole: Role | null;
  currentProfile: Profile | null;
  switchSchool: (schoolId: string) => void;
  refreshData: () => Promise<void>;

  // Data collections (RLS scoped via Supabase session)
  students: Student[];
  staff: Staff[];
  classes: ClassRoom[];
  attendance: AttendanceRecord[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  announcements: Announcement[];
  homework: Homework[];
  homeworkSubmissions: HomeworkSubmission[];

  // Student/Parent specific
  parentChildren: Student[];
  activeParentChildId: string | null;
  setActiveParentChildId: (id: string) => void;

  // Actions
  createAnnouncement: (title: string, content: string, target_role?: string) => Promise<{ success: boolean; error?: string }>;
  markAttendance: (records: Array<{ student_id: string; status: AttendanceStatus; class_id?: string }>, date: string) => Promise<{ success: boolean; error?: string }>;
  recordFeePayment: (studentId: string, amount: number, paymentMethod: string, feeStructureId?: string) => Promise<{ success: boolean; error?: string }>;
  createHomework: (classId: string, title: string, description: string, dueDate: string) => Promise<{ success: boolean; error?: string }>;
  submitHomework: (homeworkId: string, studentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  toggleFeatureFlag: (schoolId: string, flag: string, value: boolean) => Promise<void>;
}

const EduOSContext = createContext<EduOSContextType | null>(null);

export const EduOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);

  // Collections
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);

  // Parent active child
  const [activeParentChildId, setActiveParentChildId] = useState<string | null>(null);

  // Sync profile when auth user is available
  const syncProfile = useCallback(async (user: any) => {
    if (!user) {
      setCurrentProfile(null);
      setCurrentSchoolId(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        let role = profile.role as Role;
        if (user.email === 'dhruvedition@gmail.com') {
          role = 'super_admin';
        }
        setCurrentProfile({
          ...profile,
          role,
        });
        setCurrentSchoolId(profile.school_id || null);
      } else {
        // Fallback to user metadata if profile row isn't yet queried
        let metaRole = (user.user_metadata?.role || 'student') as Role;
        if (user.email === 'dhruvedition@gmail.com') {
          metaRole = 'super_admin';
        }
        const fallbackProf: Profile = {
          id: user.id,
          school_id: user.user_metadata?.school_id || null,
          role: metaRole,
          full_name: user.user_metadata?.full_name || user.email || 'User',
          email: user.email || '',
        };
        setCurrentProfile(fallbackProf);
        setCurrentSchoolId(fallbackProf.school_id);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, []);

  // Initialize Supabase Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) {
        syncProfile(initSession.user).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    }).catch(() => {
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await syncProfile(newSession.user);
      } else {
        setCurrentProfile(null);
        setCurrentSchoolId(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  // Load tenant and platform schools
  useEffect(() => {
    const fetchSchools = async () => {
      if (!session) {
        setSchools([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          setSchools(data);
          if (data.length > 0 && !currentSchoolId && currentProfile?.role === 'super_admin') {
            setCurrentSchoolId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load schools:', e);
      }
    };

    fetchSchools();
  }, [session, currentProfile?.role, currentSchoolId]);

  // Resolve current active school
  const currentSchool = useMemo(() => {
    if (!currentSchoolId) return schools[0] || null;
    return schools.find((s) => s.id === currentSchoolId) || null;
  }, [schools, currentSchoolId]);

  // Dynamic White-Label Brand Theme Injection
  useEffect(() => {
    const brandColor = currentSchool?.brand_color || currentSchool?.primary_color || '#2563eb';
    document.documentElement.style.setProperty('--school-brand', brandColor);
    document.documentElement.style.setProperty('--primary-school', brandColor);
  }, [currentSchool]);

  // Load School Data via RLS
  const refreshData = useCallback(async () => {
    if (!session) return;

    try {
      // 1. Students
      const { data: stdData } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });
      if (stdData) {
        // Map fields for UI compatibility
        const mapped = stdData.map((s: any) => ({
          ...s,
          name: s.full_name || s.name,
          admission_no: s.admission_number || s.admission_no,
          roll_no: s.roll_number || s.roll_no,
        }));
        setStudents(mapped);
      }

      // 2. Staff
      const { data: stfData } = await supabase
        .from('staff')
        .select('*, profiles:profile_id(full_name, email, phone)')
        .order('created_at', { ascending: false });
      if (stfData) {
        const mapped = stfData.map((st: any) => ({
          ...st,
          full_name: st.profiles?.full_name || st.name,
          name: st.profiles?.full_name || st.name,
          email: st.profiles?.email || st.email,
          phone: st.profiles?.phone || st.phone,
        }));
        setStaff(mapped);
      }

      // 3. Classes
      const { data: clsData } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });
      if (clsData) setClasses(clsData);

      // 4. Attendance
      const { data: attData } = await supabase
        .from('attendance')
        .select('*, students(full_name, admission_number, roll_number)')
        .order('date', { ascending: false });
      if (attData) setAttendance(attData);

      // 5. Fee Structure
      let { data: fsData, error: fsErr } = await supabase
        .from('fee_structures')
        .select('*')
        .order('created_at', { ascending: false });
      if (fsErr) {
        const fallback = await supabase
          .from('fee_structure')
          .select('*')
          .order('created_at', { ascending: false });
        fsData = fallback.data;
      }
      if (fsData) setFeeStructures(fsData);

      // 6. Fee Payments
      const { data: fpData } = await supabase
        .from('fee_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (fpData) {
        const mapped = fpData.map((p: any) => ({
          ...p,
          payment_date: p.payment_date || (p.paid_at ? p.paid_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        }));
        setFeePayments(mapped);
      }

      // 7. Announcements
      const { data: ancData } = await supabase
        .from('announcements')
        .select('*, profiles:created_by(full_name, role)')
        .order('created_at', { ascending: false });
      if (ancData) {
        const mapped = ancData.map((a: any) => ({
          ...a,
          body: a.content || a.body,
        }));
        setAnnouncements(mapped);
      }

      // 8. Homework
      const { data: hwData } = await supabase
        .from('homework')
        .select('*')
        .order('due_date', { ascending: true });
      if (hwData) setHomework(hwData);

      // 9. Homework Submissions
      const { data: subData } = await supabase
        .from('homework_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (subData) setHomeworkSubmissions(subData);
    } catch (err) {
      console.error('Error fetching tenant data:', err);
    }
  }, [session]);

  useEffect(() => {
    refreshData();
  }, [refreshData, currentSchoolId]);

  // Resolve Parent's children
  const parentChildren = useMemo(() => {
    if (!currentProfile || currentProfile.role !== 'parent') return [];
    return students.filter((s) => s.guardian_profile_id === currentProfile.id);
  }, [students, currentProfile]);

  useEffect(() => {
    if (parentChildren.length > 0 && (!activeParentChildId || !parentChildren.some((c) => c.id === activeParentChildId))) {
      setActiveParentChildId(parentChildren[0].id);
    }
  }, [parentChildren, activeParentChildId]);

  // Auth actions
  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; role?: Role; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error || !data?.user) {
        return { success: false, error: error?.message || 'Invalid credentials' };
      }

      setSession(data.session);
      await syncProfile(data.user);

      // Determine role
      let userRole: Role = (data.user.user_metadata?.role as Role) || 'student';
      if (data.user.email === 'dhruvedition@gmail.com') {
        userRole = 'super_admin';
      }

      return { success: true, role: userRole };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setSession(null);
    setCurrentProfile(null);
    setCurrentSchoolId(null);
  };

  const switchSchool = (schoolId: string) => {
    setCurrentSchoolId(schoolId);
  };

  // Actions
  const createAnnouncement = async (title: string, content: string, target_role: string = 'all') => {
    if (!currentSchoolId || !currentProfile) return { success: false, error: 'Not authenticated' };
    try {
      const { error } = await supabase.from('announcements').insert([
        {
          school_id: currentSchoolId,
          title,
          content,
          target_role,
          created_by: currentProfile.id,
        },
      ]);
      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create announcement' };
    }
  };

  const markAttendance = async (records: Array<{ student_id: string; status: AttendanceStatus; class_id?: string }>, date: string) => {
    if (!currentSchoolId || !currentProfile) return { success: false, error: 'Not authenticated' };
    try {
      const formatted = records.map((r) => ({
        school_id: currentSchoolId,
        student_id: r.student_id,
        class_id: r.class_id || classes[0]?.id,
        date,
        status: r.status,
        recorded_by: currentProfile.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(formatted, { onConflict: 'student_id,date' });

      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save attendance' };
    }
  };

  const recordFeePayment = async (studentId: string, amount: number, paymentMethod: string, feeStructureId?: string) => {
    if (!currentSchoolId || !currentProfile) return { success: false, error: 'Not authenticated' };
    const receiptNum = `REC-${Date.now().toString().slice(-6)}`;
    try {
      const { error } = await supabase.from('fee_payments').insert([
        {
          school_id: currentSchoolId,
          student_id: studentId,
          fee_structure_id: feeStructureId || null,
          amount_paid: amount,
          payment_method: paymentMethod,
          receipt_number: receiptNum,
          recorded_by: currentProfile.id,
        },
      ]);
      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to record payment' };
    }
  };

  const createHomework = async (classId: string, title: string, description: string, dueDate: string) => {
    if (!currentSchoolId || !currentProfile) return { success: false, error: 'Not authenticated' };
    try {
      const { error } = await supabase.from('homework').insert([
        {
          school_id: currentSchoolId,
          class_id: classId,
          teacher_id: currentProfile.id,
          title,
          description,
          due_date: dueDate,
        },
      ]);
      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to post homework' };
    }
  };

  const submitHomework = async (homeworkId: string, studentId: string, content: string) => {
    if (!currentSchoolId) return { success: false, error: 'Not authenticated' };
    try {
      const { error } = await supabase.from('homework_submissions').upsert([
        {
          school_id: currentSchoolId,
          homework_id: homeworkId,
          student_id: studentId,
          submission_content: content,
          submitted_at: new Date().toISOString(),
        },
      ], { onConflict: 'homework_id,student_id' });
      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit homework' };
    }
  };

  const toggleFeatureFlag = async (schoolId: string, flag: string, value: boolean) => {
    try {
      const targetSchool = schools.find((s) => s.id === schoolId);
      const currentFlags = (targetSchool?.feature_flags as any) || {};
      const updatedFlags = { ...currentFlags, [flag]: value };

      const { error } = await supabase
        .from('schools')
        .update({ feature_flags: updatedFlags })
        .eq('id', schoolId);

      if (!error) {
        setSchools((prev) =>
          prev.map((s) => (s.id === schoolId ? { ...s, feature_flags: updatedFlags } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle feature flag:', e);
    }
  };

  const currentRole = currentProfile?.role || null;

  return (
    <EduOSContext.Provider
      value={{
        session,
        authLoading,
        logout,
        loginWithCredentials,

        schools,
        currentSchoolId,
        currentSchool,
        currentRole,
        currentProfile,
        switchSchool,
        refreshData,

        students,
        staff,
        classes,
        attendance,
        feeStructures,
        feePayments,
        announcements,
        homework,
        homeworkSubmissions,

        parentChildren,
        activeParentChildId,
        setActiveParentChildId,

        createAnnouncement,
        markAttendance,
        recordFeePayment,
        createHomework,
        submitHomework,
        toggleFeatureFlag,
      }}
    >
      {children}
    </EduOSContext.Provider>
  );
};

export const useEduOS = () => {
  const context = useContext(EduOSContext);
  if (!context) {
    throw new Error('useEduOS must be used within an EduOSProvider');
  }
  return context;
};
