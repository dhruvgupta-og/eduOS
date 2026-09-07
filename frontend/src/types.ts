export type Role = 'principal' | 'teacher' | 'student' | 'parent' | 'super_admin' | 'admin' | 'accountant';

export type SubscriptionTier = 'basic' | 'standard' | 'professional' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'trial';
export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'alumni';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type PaymentMethod = 'online' | 'cash' | 'cheque' | 'card' | 'bank_transfer';
export type PaymentStatus = 'paid' | 'partial' | 'pending';
export type TargetRole = 'all' | 'teacher' | 'student' | 'parent';

export interface GradingConfig {
  type: 'marks' | 'gpa' | 'cbse' | 'icse';
  passingPercentage: number;
  scales: {
    min: number;
    max: number;
    grade: string;
    gpa?: number;
    remark?: string;
  }[];
}

export interface FeatureFlags {
  attendance: boolean;
  fees: boolean;
  homework: boolean;
  announcements: boolean;
  sis?: boolean;
  academics?: boolean;
  timetable?: boolean;
  exams?: boolean;
  transport?: boolean;
  library?: boolean;
  analytics?: boolean;
}

export interface School {
  id: string;
  name: string;
  slug?: string;
  subdomain?: string;
  code?: string;
  logo_url?: string;
  brand_color?: string;
  primary_color?: string;
  secondary_color?: string;
  feature_flags?: FeatureFlags;
  grading_config?: GradingConfig;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  created_at: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Profile {
  id: string;
  school_id: string | null;
  role: Role;
  full_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  full_name: string;
  name?: string; // alias for UI compatibility
  admission_number: string;
  admission_no?: string; // alias
  roll_number?: string;
  roll_no?: string; // alias
  class_id?: string;
  profile_id?: string | null;
  guardian_profile_id?: string | null;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  status: StudentStatus;
  dob?: string;
  photo_url?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
}

export interface Staff {
  id: string;
  school_id: string;
  profile_id: string;
  full_name?: string;
  name?: string; // alias
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  joining_date?: string;
  role?: string;
  created_at?: string;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  name: string;
  grade_level?: string;
  section?: string;
  class_teacher_id?: string | null;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  date: string;
  status: AttendanceStatus;
  recorded_by?: string | null;
  created_at?: string;
  students?: {
    full_name: string;
    admission_number: string;
    roll_number?: string;
  };
}

export interface FeeStructure {
  id: string;
  school_id: string;
  class_id?: string | null;
  fee_head: string;
  amount: number;
  term: string;
  due_date?: string;
  created_at?: string;
}

export interface FeePayment {
  id: string;
  school_id: string;
  student_id: string;
  fee_structure_id?: string | null;
  amount_paid: number;
  payment_method: string;
  transaction_reference?: string;
  receipt_number: string;
  paid_at?: string;
  payment_date?: string; // alias
  status?: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  school_id: string;
  title: string;
  content: string;
  body?: string; // alias
  target_role: string;
  created_by?: string | null;
  created_at?: string;
  profiles?: {
    full_name: string;
    role: string;
  };
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  teacher_id?: string;
  title: string;
  description: string;
  due_date: string;
  created_at?: string;
}

export interface HomeworkSubmission {
  id: string;
  school_id: string;
  homework_id: string;
  student_id: string;
  submission_content?: string;
  file_url?: string;
  grade?: string;
  feedback?: string;
  submitted_at: string;
  status?: string;
}

export interface SimulatedNotification {
  id: string;
  school_id: string;
  channel: 'sms' | 'email' | 'push';
  recipient: string;
  title: string;
  message: string;
  timestamp: string;
}
