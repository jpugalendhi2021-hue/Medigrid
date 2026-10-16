export type Role = 'patient' | 'doctor' | 'hospital_admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  hospital_id?: string;
  department_id?: string;
}

export interface Hospital {
  id: string;
  name: string;
  district: string;
  address: string;
  contact: string;
  status: 'active' | 'busy' | 'critical_staffing';
  bedsCount: number;
  admin_id?: string;
  admin_name?: string;
  admin_email?: string;
  activeDoctorsCount?: number;
  totalAppointmentsToday?: number;
  pendingEscalationsCount?: number;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  iconName: string;
  headDoctorName: string;
  opdWing?: string;
  dailyCapacity?: number;
  activeSpecialistsCount?: number;
  phoneExtension?: string;
}

export type DoctorStatus = 'available' | 'in-consultation' | 'high-load' | 'on-leave';

export interface Doctor {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  hospital_id: string;
  department_id: string;
  department_name?: string;
  specialization: string;
  experienceYears: number;
  avgDailyCapacity: number;
  todayPatientCount: number;
  status: DoctorStatus;
  is_available?: boolean;
  weekly_schedule: string[];
  qualifications: string;
  roomNumber: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'escalated_to_dean';

export interface LeaveRequest {
  id: string;
  doctor_id: string;
  doctor_name: string;
  hospital_id: string;
  hospital_name: string;
  department_id: string;
  department_name: string;
  start_date: string;
  end_date: string;
  consecutive_days: number;
  reason: string;
  is_rule_exceeded: boolean; // Exceeds continuous limit (> 2 consecutive days)
  status: LeaveStatus;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  escalated_reason?: string;
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  chronic_conditions: string[];
  primary_doctor_id?: string;
  primary_department_id?: string;
  emergency_contact: string;
  allergies?: string[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in-consultation' | 'completed' | 'cancelled';
export type AssignmentReason = 'load-balanced' | 'chronic-continuity' | 'substitute';

export interface Appointment {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  doctor_id: string;
  doctor_name: string;
  hospital_id: string;
  hospital_name: string;
  department_id: string;
  department_name: string;
  date: string;
  time_slot: string;
  symptoms: string;
  status: AppointmentStatus;
  assignment_reason: AssignmentReason;
  is_substitute: boolean;
  substitute_for_doctor_name?: string;
  is_chronic_continuity: boolean;
  queue_position?: number;
  created_at: string;
  completed_at?: string;
}

export interface CheckupRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  hospital_name: string;
  date: string;
  bp_sys: number;
  bp_dia: number;
  heart_rate: number;
  weight_kg: number;
  sugar_mg_dl: number;
  diagnosis: string;
  prescriptions: {
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  clinical_notes: string;
  chronic_flag_added?: string;
  follow_up_date?: string;
}

export interface LabReport {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  hospital_id: string;
  hospital_name: string;
  title: string;
  report_type: 'Biochemistry' | 'Hematology' | 'Endocrine' | 'Radiology' | 'Cardiology' | 'Pathology' | string;
  date: string;
  ordered_by: string;
  status: 'ready' | 'processing';
  summary: string;
  file_name?: string;
  file_data?: string;
  file_size?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  parameters: {
    name: string;
    value: string;
    normal_range: string;
    unit: string;
    flag: 'normal' | 'high' | 'low';
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: Role;
  category: 'allocation' | 'leave' | 'clinical' | 'admin' | 'governance';
  action: string;
  details: string;
}

export interface RealtimeNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  role_target?: Role;
}
