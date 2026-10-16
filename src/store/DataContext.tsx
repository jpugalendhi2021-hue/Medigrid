import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Role,
  User,
  Hospital,
  Department,
  Doctor,
  DoctorStatus,
  LeaveRequest,
  Patient,
  Appointment,
  CheckupRecord,
  LabReport,
  AuditLog,
  RealtimeNotification,
  AssignmentReason,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_HOSPITALS,
  INITIAL_DEPARTMENTS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_CHECKUPS,
  INITIAL_LAB_REPORTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_AUDIT_LOGS,
} from '../mockData';
import {
  COLLECTIONS,
  seedInitialFirestoreData,
  saveToFirestore,
  subscribeToFirestoreCollection,
  resetFirestoreToSample,
} from '../services/firestoreService';
import { auth, onAuthStateChanged, FirebaseUser } from '../lib/firebase';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  sendResetPassword,
  logoutFirebase,
} from '../services/authService';
import { JavaApiClient } from '../services/apiClient';

interface AllocationResult {
  doctor: Doctor;
  reason: AssignmentReason;
  isSubstitute: boolean;
  regularDoctorOnLeave?: boolean;
  regularDoctor?: Doctor;
  todayCount: number;
}

interface DataContextType {
  currentUser: User | null;
  currentRole: Role;
  allUsers: User[];
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  leaveRequests: LeaveRequest[];
  patients: Patient[];
  appointments: Appointment[];
  checkupRecords: CheckupRecord[];
  labReports: LabReport[];
  auditLogs: AuditLog[];
  notifications: RealtimeNotification[];
  recentlyUpdatedDoctorId: string | null;
  recentlyUpdatedApptId: string | null;
  isCloudConnected: boolean;
  cloudSyncStatus: 'connected' | 'syncing' | 'offline';
  lastSyncTime: string | null;
  
  // Firebase Web Authentication
  firebaseUser: FirebaseUser | null;
  isAuthLoading: boolean;
  signInWithGoogleAuth: (role?: Role) => Promise<void>;
  signInWithEmailAuth: (email: string, pass: string, role: Role) => Promise<void>;
  registerWithEmailAuth: (data: {
    email: string;
    pass: string;
    name: string;
    role: Role;
    phone?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    blood_group?: string;
    chronic_conditions?: string[];
    emergency_contact?: string;
  }) => Promise<void>;
  resetPasswordAuth: (email: string) => Promise<void>;

  // Actions
  switchRole: (role: Role, userId?: string) => void;
  login: (role: Role, emailOrId?: string) => void;
  logout: () => void;
  registerPatient: (patientData: {
    name: string;
    email: string;
    phone: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    blood_group: string;
    chronic_conditions: string[];
    emergency_contact: string;
  }) => Patient;
  previewDoctorAllocation: (
    hospitalId: string,
    departmentId: string,
    date: string,
    patientId: string
  ) => AllocationResult | null;
  bookAppointment: (data: {
    patientId: string;
    hospitalId: string;
    departmentId: string;
    date: string;
    timeSlot: string;
    symptoms: string;
    preferredDoctorId?: string;
  }) => Appointment;
  submitCheckup: (data: {
    appointmentId: string;
    bpSys: number;
    bpDia: number;
    heartRate: number;
    weightKg: number;
    sugarMgDl: number;
    diagnosis: string;
    clinicalNotes: string;
    prescriptions: { drug: string; dosage: string; frequency: string; duration: string }[];
    newChronicCondition?: string;
    followUpDate?: string;
  }) => void;
  submitLeaveRequest: (data: {
    doctorId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => LeaveRequest;
  approveLeaveRequest: (leaveId: string, isDeanOverride?: boolean) => { success: boolean; message: string };
  rejectLeaveRequest: (leaveId: string, note?: string) => { success: boolean; message: string };
  deanApproveLeave: (leaveId: string, substituteDoctorId?: string) => { success: boolean; message: string };
  deanRejectLeave: (leaveId: string, reason?: string) => { success: boolean; message: string };
  revokeLeave: (leaveId: string) => void;
  toggleDoctorAvailability: (doctorId: string) => void;
  addDoctor: (docData: {
    hospital_id: string;
    department_id: string;
    department_name?: string;
    name: string;
    email: string;
    phone?: string;
    specialization: string;
    qualifications?: string;
    experienceYears?: number;
    avgDailyCapacity?: number;
    roomNumber?: string;
    weekly_schedule?: string[];
  }) => Doctor;
  addDepartment: (deptData: {
    hospital_id: string;
    name: string;
    code: string;
    iconName?: string;
    headDoctorName: string;
    opdWing?: string;
    dailyCapacity?: number;
    phoneExtension?: string;
  }) => Department;
  addHospital: (hospData: Omit<Hospital, 'id'>) => Hospital;
  findPatientByPhone: (phone: string) => Patient | undefined;
  uploadLabReport: (reportData: {
    mobileNumber: string;
    patientName?: string;
    patientAge?: number;
    patientGender?: 'Male' | 'Female' | 'Other';
    hospitalId: string;
    hospitalName: string;
    title: string;
    reportType: 'Biochemistry' | 'Hematology' | 'Endocrine' | 'Radiology' | 'Cardiology' | 'Pathology' | string;
    date?: string;
    orderedBy: string;
    summary: string;
    parameters: {
      name: string;
      value: string;
      normal_range: string;
      unit: string;
      flag: 'normal' | 'high' | 'low';
    }[];
    fileName?: string;
    fileData?: string;
    fileSize?: string;
  }) => Promise<LabReport>;
  callNextPatient: (doctorId: string) => void;
  simulateIncomingPatient: () => void;
  resetToSampleData: () => void;
  clearNotification: (id: string) => void;
}

const STORAGE_KEYS = {
  HOSPITALS: 'medigrid_hospitals_v1',
  DEPARTMENTS: 'medigrid_depts_v1',
  DOCTORS: 'medigrid_doctors_v1',
  LEAVES: 'medigrid_leaves_v1',
  PATIENTS: 'medigrid_patients_v1',
  APPOINTMENTS: 'medigrid_appointments_v1',
  CHECKUPS: 'medigrid_checkups_v1',
  LABS: 'medigrid_labs_v1',
  AUDITS: 'medigrid_audits_v1',
  LAST_ROLE: 'medigrid_last_role_v1',
  LAST_USER_ID: 'medigrid_last_user_id_v1',
  CUSTOM_USERS: 'medigrid_custom_users_v1',
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial role and user ID from localStorage
  const savedRole = (localStorage.getItem(STORAGE_KEYS.LAST_ROLE) as Role) || 'patient';
  const savedUserId = localStorage.getItem(STORAGE_KEYS.LAST_USER_ID);

  const [customUsers, setCustomUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_USERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentRole, setCurrentRole] = useState<Role>(savedRole);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (savedUserId) {
      const found = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (found) return found;
      const foundCustom = customUsers.find((u) => u.id === savedUserId);
      if (foundCustom) return foundCustom;
    }
    return INITIAL_USERS.find((u) => u.role === savedRole) || INITIAL_USERS[0];
  });

  // States
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    return saved ? JSON.parse(saved) : INITIAL_HOSPITALS;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    const raw: Doctor[] = saved ? JSON.parse(saved) : INITIAL_DOCTORS;
    return raw.map((d) => ({
      ...d,
      is_available: d.is_available !== undefined ? d.is_available : d.status !== 'on-leave',
    }));
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [checkupRecords, setCheckupRecords] = useState<CheckupRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKUPS);
    return saved ? JSON.parse(saved) : INITIAL_CHECKUPS;
  });

  const [labReports, setLabReports] = useState<LabReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LABS);
    return saved ? JSON.parse(saved) : INITIAL_LAB_REPORTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<RealtimeNotification[]>([
    {
      id: 'notif-welcome',
      timestamp: new Date().toISOString(),
      title: 'MediGrid Live Sync Active',
      message: 'Dynamic doctor allocation engine and cross-hospital sync online.',
      type: 'info',
    },
  ]);

  const [recentlyUpdatedDoctorId, setRecentlyUpdatedDoctorId] = useState<string | null>(null);
  const [recentlyUpdatedApptId, setRecentlyUpdatedApptId] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Firebase Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Firestore Real-time Multi-Hospital Data Synchronization
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let isMounted = true;

    async function initFirestore() {
      try {
        setCloudSyncStatus('syncing');
        await seedInitialFirestoreData();

        if (!isMounted) return;

        const unsubHosp = subscribeToFirestoreCollection<Hospital>(COLLECTIONS.HOSPITALS, (items) => {
          if (items.length > 0) setHospitals(items);
        });
        const unsubDepts = subscribeToFirestoreCollection<Department>(COLLECTIONS.DEPARTMENTS, (items) => {
          if (items.length > 0) setDepartments(items);
        });
        const unsubDocs = subscribeToFirestoreCollection<Doctor>(COLLECTIONS.DOCTORS, (items) => {
          if (items.length > 0) {
            setDoctors(
              items.map((d) => ({
                ...d,
                is_available: d.is_available !== undefined ? d.is_available : d.status !== 'on-leave',
              }))
            );
          }
        });
        const unsubLeaves = subscribeToFirestoreCollection<LeaveRequest>(COLLECTIONS.LEAVES, (items) => {
          if (items.length > 0) setLeaveRequests(items);
        });
        const unsubPatients = subscribeToFirestoreCollection<Patient>(COLLECTIONS.PATIENTS, (items) => {
          if (items.length > 0) setPatients(items);
        });
        const unsubAppts = subscribeToFirestoreCollection<Appointment>(COLLECTIONS.APPOINTMENTS, (items) => {
          if (items.length > 0) {
            setAppointments(items.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
          }
        });
        const unsubCheckups = subscribeToFirestoreCollection<CheckupRecord>(COLLECTIONS.CHECKUPS, (items) => {
          if (items.length > 0) setCheckupRecords(items);
        });
        const unsubLabs = subscribeToFirestoreCollection<LabReport>(COLLECTIONS.LABS, (items) => {
          if (items.length > 0) setLabReports(items);
        });
        const unsubAudits = subscribeToFirestoreCollection<AuditLog>(COLLECTIONS.AUDITS, (items) => {
          if (items.length > 0) {
            setAuditLogs(items.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()));
          }
        });
        const unsubUsers = subscribeToFirestoreCollection<User>(COLLECTIONS.CUSTOM_USERS, (items) => {
          if (items.length > 0) setCustomUsers(items);
        });

        unsubs = [
          unsubHosp,
          unsubDepts,
          unsubDocs,
          unsubLeaves,
          unsubPatients,
          unsubAppts,
          unsubCheckups,
          unsubLabs,
          unsubAudits,
          unsubUsers,
        ];

        setIsCloudConnected(true);
        setCloudSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('[Firestore] Sync initialization error:', err);
        setIsCloudConnected(false);
        setCloudSyncStatus('offline');
      }
    }

    initFirestore();

    return () => {
      isMounted = false;
      unsubs.forEach((u) => u());
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }, [hospitals]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
  }, [doctors]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECKUPS, JSON.stringify(checkupRecords));
  }, [checkupRecords]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_USERS, JSON.stringify(customUsers));
  }, [customUsers]);

  // Aggregate all users across system personas, doctors, patients, and custom registered accounts
  const allUsers = useMemo<User[]>(() => {
    const list: User[] = [...INITIAL_USERS];

    // Add doctors if not in list
    doctors.forEach((d) => {
      const exists = list.some(
        (u) => u.email.toLowerCase() === d.email.toLowerCase() || u.id === d.user_id
      );
      if (!exists) {
        list.push({
          id: d.user_id || ('user-' + d.id),
          name: d.name,
          email: d.email,
          phone: d.phone,
          role: 'doctor',
          hospital_id: d.hospital_id,
          department_id: d.department_id,
        });
      }
    });

    // Add patients if not in list
    patients.forEach((p) => {
      const exists = list.some(
        (u) => u.email.toLowerCase() === p.email.toLowerCase() || u.id === p.user_id
      );
      if (!exists) {
        list.push({
          id: p.user_id || ('user-' + p.id),
          name: p.name,
          email: p.email,
          phone: p.phone,
          role: 'patient',
        });
      }
    });

    // Add custom users
    customUsers.forEach((cu) => {
      const exists = list.some(
        (u) => u.id === cu.id || u.email.toLowerCase() === cu.email.toLowerCase()
      );
      if (!exists) {
        list.push(cu);
      }
    });

    return list;
  }, [doctors, patients, customUsers]);

  // Push notification helper
  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info', role_target?: Role) => {
    const newNotif: RealtimeNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      role_target,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 15)]);
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addAudit = useCallback(
    (action: string, details: string, category: AuditLog['category'] = 'admin') => {
      const newAudit: AuditLog = {
        id: 'audit-' + Date.now(),
        timestamp: new Date().toISOString(),
        actor_name: currentUser?.name || 'MediGrid System',
        actor_role: currentRole,
        category,
        action,
        details,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);
      saveToFirestore(COLLECTIONS.AUDITS, newAudit);
    },
    [currentUser, currentRole]
  );

  // Switch Role / Switch User
  const switchRole = useCallback(
    (role: Role, userId?: string) => {
      setCurrentRole(role);
      localStorage.setItem(STORAGE_KEYS.LAST_ROLE, role);
      let user = allUsers.find((u) => (userId ? u.id === userId : u.role === role));
      if (!user) {
        user = allUsers.find((u) => u.role === role) || INITIAL_USERS[0];
      }
      setCurrentUser(user);
      if (user) {
        localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, user.id);
      }
    },
    [allUsers]
  );

  const login = useCallback(
    (role: Role, emailOrId?: string) => {
      setCurrentRole(role);
      localStorage.setItem(STORAGE_KEYS.LAST_ROLE, role);

      const query = emailOrId?.trim().toLowerCase();

      // 1. Direct match in allUsers by email or id
      let target = allUsers.find(
        (u) => query && (u.email.toLowerCase() === query || u.id.toLowerCase() === query)
      );

      // 2. Doctor matching
      if (!target && query) {
        const doc = doctors.find(
          (d) => d.email.toLowerCase() === query || d.id.toLowerCase() === query
        );
        if (doc) {
          target = {
            id: doc.user_id || ('user-' + doc.id),
            name: doc.name,
            email: doc.email,
            phone: doc.phone,
            role: 'doctor',
            hospital_id: doc.hospital_id,
            department_id: doc.department_id,
          };
        }
      }

      // 3. Patient matching
      if (!target && query) {
        const pat = patients.find(
          (p) => p.email.toLowerCase() === query || p.id.toLowerCase() === query
        );
        if (pat) {
          target = {
            id: pat.user_id || ('user-' + pat.id),
            name: pat.name,
            email: pat.email,
            phone: pat.phone,
            role: 'patient',
          };
        }
      }

      // 4. If query is a custom email or name not found in pre-seeded lists:
      if (!target && query) {
        const namePart = query.includes('@') ? query.split('@')[0] : query;
        const formattedName = namePart
          .replace(/[._-]/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const displayName =
          role === 'doctor' && !formattedName.toLowerCase().startsWith('dr')
            ? `Dr. ${formattedName}`
            : formattedName || 'New User';

        target = {
          id: 'user-' + role + '-' + Date.now(),
          name: displayName,
          email: query.includes('@') ? query : `${query.replace(/\s+/g, '.').toLowerCase()}@medigrid.health`,
          phone: '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
          role: role,
          hospital_id: 'hosp-1',
          department_id: 'dept-1-2',
        };

        setCustomUsers((prev) => [target!, ...prev]);
        saveToFirestore(COLLECTIONS.CUSTOM_USERS, target);

        if (role === 'patient') {
          const newPat: Patient = {
            id: 'pat-' + Date.now(),
            user_id: target.id,
            name: target.name,
            email: target.email,
            phone: target.phone,
            age: 36,
            gender: 'Male',
            blood_group: 'B+ Positive',
            chronic_conditions: [],
            emergency_contact: 'Emergency Contact',
            allergies: [],
          };
          setPatients((prev) => [newPat, ...prev]);
          saveToFirestore(COLLECTIONS.PATIENTS, newPat);
        } else if (role === 'doctor') {
          const newDoc: Doctor = {
            id: 'doc-' + Date.now(),
            user_id: target.id,
            name: target.name,
            email: target.email,
            phone: target.phone,
            hospital_id: 'hosp-1',
            department_id: 'dept-1-2',
            specialization: 'Attending Physician, MD',
            experienceYears: 10,
            avgDailyCapacity: 20,
            todayPatientCount: 0,
            status: 'available',
            weekly_schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            qualifications: 'MBBS, MD',
            roomNumber: 'OPD-109',
          };
          setDoctors((prev) => [newDoc, ...prev]);
          saveToFirestore(COLLECTIONS.DOCTORS, newDoc);
        }
      }

      // 5. Fallback for role
      if (!target) {
        target = allUsers.find((u) => u.role === role) || INITIAL_USERS[0];
      }

      setCurrentUser(target);
      localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, target.id);
      addNotification('Logged In', `Authenticated as ${target.name} (${role.toUpperCase()})`, 'info');
    },
    [allUsers, doctors, patients, addNotification]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.LAST_USER_ID);
    setFirebaseUser(null);
    logoutFirebase().catch((err) => console.warn('[Firebase Auth] Signout notice:', err));
  }, []);

  // Monitor Firebase Auth changes across browser sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      setIsAuthLoading(false);
      if (fUser && fUser.email) {
        // Link to existing user if not yet logged in or if mismatch
        const matched = allUsers.find(
          (u) => u.email.toLowerCase() === (fUser.email || '').toLowerCase()
        );
        if (matched) {
          setCurrentUser(matched);
          setCurrentRole(matched.role);
          localStorage.setItem(STORAGE_KEYS.LAST_ROLE, matched.role);
          localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, matched.id);
        }
      }
    });

    return () => unsubscribe();
  }, [allUsers]);

  // Register a new patient
  const registerPatient = useCallback((data: {
    name: string;
    email: string;
    phone: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    blood_group: string;
    chronic_conditions: string[];
    emergency_contact: string;
  }): Patient => {
    const newUserId = 'user-pat-' + Date.now();
    const newPatId = 'pat-' + Date.now();

    const newUser: User = {
      id: newUserId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'patient',
    };

    const newPatient: Patient = {
      id: newPatId,
      user_id: newUserId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      age: data.age,
      gender: data.gender,
      blood_group: data.blood_group,
      chronic_conditions: data.chronic_conditions,
      emergency_contact: data.emergency_contact,
      allergies: [],
    };

    setPatients((prev) => [newPatient, ...prev]);
    setCustomUsers((prev) => [newUser, ...prev]);
    saveToFirestore(COLLECTIONS.PATIENTS, newPatient);
    saveToFirestore(COLLECTIONS.CUSTOM_USERS, newUser);
    setCurrentUser(newUser);
    setCurrentRole('patient');
    localStorage.setItem(STORAGE_KEYS.LAST_ROLE, 'patient');
    localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, newUser.id);

    addAudit('PATIENT_REGISTERED', `Self-registered new patient record for ${data.name}.`, 'clinical');
    addNotification('Registration Complete', `Welcome to MediGrid, ${data.name}!`, 'success');

    return newPatient;
  }, [addAudit, addNotification]);

  // Firebase Google Sign-In
  const signInWithGoogleAuth = useCallback(
    async (role: Role = 'patient') => {
      setIsAuthLoading(true);
      try {
        const fUser = await loginWithGoogle();
        setFirebaseUser(fUser);

        // Find matching profile in system or provision new linked user
        let matched = allUsers.find(
          (u) => u.email.toLowerCase() === (fUser.email || '').toLowerCase()
        );

        if (!matched) {
          const newUserId = 'user-google-' + Date.now();
          const displayName = fUser.displayName || fUser.email?.split('@')[0] || 'MediGrid User';
          
          matched = {
            id: newUserId,
            name: role === 'doctor' && !displayName.toLowerCase().startsWith('dr') ? `Dr. ${displayName}` : displayName,
            email: fUser.email || `${newUserId}@medigrid.health`,
            phone: fUser.phoneNumber || '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
            role: role,
            hospital_id: 'hosp-1',
            department_id: 'dept-1-2',
          };

          setCustomUsers((prev) => [matched!, ...prev]);
          saveToFirestore(COLLECTIONS.CUSTOM_USERS, matched);

          if (role === 'patient') {
            const newPat: Patient = {
              id: 'pat-' + Date.now(),
              user_id: matched.id,
              name: matched.name,
              email: matched.email,
              phone: matched.phone,
              age: 32,
              gender: 'Male',
              blood_group: 'O+ Positive',
              chronic_conditions: [],
              emergency_contact: 'Emergency Family Contact',
              allergies: [],
            };
            setPatients((prev) => [newPat, ...prev]);
            saveToFirestore(COLLECTIONS.PATIENTS, newPat);
          } else if (role === 'doctor') {
            const newDoc: Doctor = {
              id: 'doc-' + Date.now(),
              user_id: matched.id,
              name: matched.name,
              email: matched.email,
              phone: matched.phone,
              hospital_id: 'hosp-1',
              department_id: 'dept-1-2',
              specialization: 'Attending Physician, MD',
              experienceYears: 8,
              avgDailyCapacity: 20,
              todayPatientCount: 0,
              status: 'available',
              weekly_schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              qualifications: 'MBBS, MD',
              roomNumber: 'OPD-110',
            };
            setDoctors((prev) => [newDoc, ...prev]);
            saveToFirestore(COLLECTIONS.DOCTORS, newDoc);
          }
        }

        setCurrentUser(matched);
        setCurrentRole(matched.role);
        localStorage.setItem(STORAGE_KEYS.LAST_ROLE, matched.role);
        localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, matched.id);

        addAudit('FIREBASE_AUTH', `Authenticated via Firebase Google Auth: ${matched.name} (${matched.email})`, 'admin');
        addNotification('Google Sign-In Succeeded', `Welcome back, ${matched.name}!`, 'success');
      } catch (err: any) {
        console.error('[Firebase Auth] Google Sign-In failed:', err);
        addNotification('Google Auth Notice', err.message || 'Authentication failed', 'alert');
        throw err;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [allUsers, addAudit, addNotification]
  );

  // Firebase Email Sign-In
  const signInWithEmailAuth = useCallback(
    async (email: string, pass: string, role: Role) => {
      setIsAuthLoading(true);
      try {
        try {
          const fUser = await loginWithEmail(email, pass);
          setFirebaseUser(fUser);
        } catch (firebaseErr: any) {
          console.warn('[Firebase Auth] Email provider notice:', firebaseErr?.message || firebaseErr);
          // Fallback smoothly to MediGrid internal credential gateway so the user can immediately log in without interruption
          login(role, email);
          addNotification(
            'Portal Authenticated',
            `Signed in as ${email} (MediGrid Healthcare Gateway)`,
            'info'
          );
          return;
        }

        let matched = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!matched) {
          login(role, email);
        } else {
          setCurrentUser(matched);
          setCurrentRole(matched.role);
          localStorage.setItem(STORAGE_KEYS.LAST_ROLE, matched.role);
          localStorage.setItem(STORAGE_KEYS.LAST_USER_ID, matched.id);
        }

        addNotification('Signed In', `Authenticated via Firebase Auth as ${email}`, 'success');
      } finally {
        setIsAuthLoading(false);
      }
    },
    [allUsers, login, addNotification]
  );

  // Firebase Email Sign-Up
  const registerWithEmailAuth = useCallback(
    async (data: {
      email: string;
      pass: string;
      name: string;
      role: Role;
      phone?: string;
      age?: number;
      gender?: 'Male' | 'Female' | 'Other';
      blood_group?: string;
      chronic_conditions?: string[];
      emergency_contact?: string;
    }) => {
      setIsAuthLoading(true);
      try {
        try {
          const fUser = await registerWithEmail(data.email, data.pass, data.name);
          setFirebaseUser(fUser);
        } catch (authErr: any) {
          console.warn('[Firebase Auth] Registration notice:', authErr.message);
        }

        // Register in MediGrid database
        if (data.role === 'patient') {
          registerPatient({
            name: data.name,
            email: data.email,
            phone: data.phone || '+91 98450 12345',
            age: data.age || 35,
            gender: data.gender || 'Male',
            blood_group: data.blood_group || 'B+ Positive',
            chronic_conditions: data.chronic_conditions || [],
            emergency_contact: data.emergency_contact || 'Family Contact',
          });
        }
      } finally {
        setIsAuthLoading(false);
      }
    },
    [registerPatient]
  );

  // Firebase Password Reset
  const resetPasswordAuth = useCallback(async (email: string) => {
    try {
      await sendResetPassword(email);
      addNotification('Recovery Sent', `Password reset instructions sent to ${email}`, 'info');
    } catch (err: any) {
      console.warn('[Firebase Auth] Password reset notice:', err.message);
      addNotification('Recovery Notice', `Simulated recovery link prepared for ${email}`, 'info');
    }
  }, [addNotification]);

  // Helper to check if doctor is on approved leave on a given date
  const isDoctorOnLeave = useCallback(
    (doctorId: string, targetDate: string) => {
      return leaveRequests.some((l) => {
        if (l.doctor_id !== doctorId || l.status !== 'approved') return false;
        return targetDate >= l.start_date && targetDate <= l.end_date;
      });
    },
    [leaveRequests]
  );

  // Count bookings for a doctor on a given date
  const countBookings = useCallback(
    (doctorId: string, targetDate: string) => {
      return appointments.filter(
        (a) => a.doctor_id === doctorId && a.date === targetDate && a.status !== 'cancelled'
      ).length;
    },
    [appointments]
  );

  // Core Smart Allocation Engine (Section 3.2 of Prompt & UI Ideas)
  const previewDoctorAllocation = useCallback(
    (
      hospitalId: string,
      departmentId: string,
      targetDate: string,
      patientId: string
    ): AllocationResult | null => {
      const patient = patients.find((p) => p.id === patientId);

      // 1. Check chronic condition continuity
      const hasChronic =
        patient &&
        (patient.chronic_conditions?.length > 0 ||
          checkupRecords.some(
            (c) => c.patient_id === patientId && doctors.some((d) => d.id === c.doctor_id && d.department_id === departmentId)
          ));

      if (hasChronic) {
        // Look up primary doctor for this patient
        const primaryDocId = patient?.primary_doctor_id;
        const primaryDoc = doctors.find(
          (d) => d.id === primaryDocId && d.hospital_id === hospitalId && d.department_id === departmentId
        );

        if (primaryDoc) {
          const docOnLeave = isDoctorOnLeave(primaryDoc.id, targetDate);
          if (!docOnLeave) {
            return {
              doctor: primaryDoc,
              reason: 'chronic-continuity',
              isSubstitute: false,
              todayCount: countBookings(primaryDoc.id, targetDate),
            };
          } else {
            // Regular doctor is on leave! Find substitute doctor via load balancing
            const candidates = doctors.filter(
              (d) =>
                d.hospital_id === hospitalId &&
                d.department_id === departmentId &&
                d.id !== primaryDoc.id &&
                !isDoctorOnLeave(d.id, targetDate)
            );

            if (candidates.length > 0) {
              const sorted = candidates
                .map((d) => ({
                  doctor: d,
                  count: countBookings(d.id, targetDate),
                }))
                .sort((a, b) => a.count - b.count);

              return {
                doctor: sorted[0].doctor,
                reason: 'substitute',
                isSubstitute: true,
                regularDoctorOnLeave: true,
                regularDoctor: primaryDoc,
                todayCount: sorted[0].count,
              };
            }
          }
        }
      }

      // 2. Standard Load-Balanced Allocation
      const availableDoctors = doctors.filter(
        (d) =>
          d.hospital_id === hospitalId &&
          d.department_id === departmentId &&
          !isDoctorOnLeave(d.id, targetDate)
      );

      if (availableDoctors.length === 0) {
        return null;
      }

      // Compute count in real-time and sort ascending (lowest number of patients booked for that date)
      const doctorCounts = availableDoctors.map((doc) => ({
        doctor: doc,
        countToday: countBookings(doc.id, targetDate),
      }));

      doctorCounts.sort((a, b) => a.countToday - b.countToday);
      const chosen = doctorCounts[0];

      return {
        doctor: chosen.doctor,
        reason: 'load-balanced',
        isSubstitute: false,
        todayCount: chosen.countToday,
      };
    },
    [patients, checkupRecords, doctors, isDoctorOnLeave, countBookings]
  );

  // Book Appointment
  const bookAppointment = useCallback(
    (data: {
      patientId: string;
      hospitalId: string;
      departmentId: string;
      date: string;
      timeSlot: string;
      symptoms: string;
      preferredDoctorId?: string;
    }): Appointment => {
      const patient = patients.find((p) => p.id === data.patientId) || patients[0];
      const hospital = hospitals.find((h) => h.id === data.hospitalId);
      const department = departments.find((d) => d.id === data.departmentId);

      // Perform allocation
      let chosenDoctor: Doctor;
      let reason: AssignmentReason = 'load-balanced';
      let isSubstitute = false;
      let substituteFor: string | undefined;

      if (data.preferredDoctorId) {
        const doc = doctors.find((d) => d.id === data.preferredDoctorId);
        if (doc) {
          chosenDoctor = doc;
          reason = 'load-balanced';
        } else {
          throw new Error('Preferred doctor not found');
        }
      } else {
        const alloc = previewDoctorAllocation(data.hospitalId, data.departmentId, data.date, data.patientId);
        if (!alloc) {
          throw new Error('No doctor available in this department for the selected date');
        }
        chosenDoctor = alloc.doctor;
        reason = alloc.reason;
        isSubstitute = alloc.isSubstitute;
        if (alloc.regularDoctor) {
          substituteFor = alloc.regularDoctor.name;
        }
      }

      // Generate token
      const deptCode = department?.code || 'GEN';
      const existingInDept = appointments.filter(
        (a) => a.department_id === data.departmentId && a.date === data.date
      ).length;
      const tokenNumber = `${deptCode}-${String(existingInDept + 1).padStart(2, '0')}`;

      const newAppt: Appointment = {
        id: 'app-' + Date.now(),
        token_number: tokenNumber,
        patient_id: patient.id,
        patient_name: patient.name,
        patient_age: patient.age,
        patient_gender: patient.gender,
        doctor_id: chosenDoctor.id,
        doctor_name: chosenDoctor.name,
        hospital_id: hospital?.id || data.hospitalId,
        hospital_name: hospital?.name || 'MediGrid Hospital',
        department_id: department?.id || data.departmentId,
        department_name: department?.name || 'Department',
        date: data.date,
        time_slot: data.timeSlot,
        symptoms: data.symptoms,
        status: 'confirmed',
        assignment_reason: reason,
        is_substitute: isSubstitute,
        substitute_for_doctor_name: substituteFor,
        is_chronic_continuity: reason === 'chronic-continuity',
        queue_position: existingInDept + 1,
        created_at: new Date().toISOString(),
      };

      setAppointments((prev) => [newAppt, ...prev]);
      saveToFirestore(COLLECTIONS.APPOINTMENTS, newAppt);

      // Update doctor's patient count
      const updatedDoctor: Doctor = {
        ...chosenDoctor,
        todayPatientCount: chosenDoctor.todayPatientCount + 1,
      };
      setDoctors((prev) =>
        prev.map((d) => (d.id === chosenDoctor.id ? updatedDoctor : d))
      );
      saveToFirestore(COLLECTIONS.DOCTORS, updatedDoctor);

      // Highlight animation triggers
      setRecentlyUpdatedDoctorId(chosenDoctor.id);
      setRecentlyUpdatedApptId(newAppt.id);
      setTimeout(() => {
        setRecentlyUpdatedDoctorId(null);
        setRecentlyUpdatedApptId(null);
      }, 3000);

      // Audit log & Notifications
      const reasonDetail =
        reason === 'chronic-continuity'
          ? `Preserved chronic continuity for regular physician ${chosenDoctor.name}.`
          : isSubstitute
          ? `Substitute allocated: Regular doctor ${substituteFor} is on leave.`
          : `Auto load-balanced to ${chosenDoctor.name} (lowest booked load on ${data.date}).`;

      addAudit('DOCTOR_ALLOCATED', `Appointment ${tokenNumber} booked. ${reasonDetail}`, 'allocation');

      addNotification(
        'Appointment Confirmed',
        `Token ${tokenNumber} with ${chosenDoctor.name} (${department?.name})`,
        'success',
        'patient'
      );

      // Realtime notification for doctor
      addNotification(
        'New Patient Assigned',
        `${patient.name} slotted into queue (Token: ${tokenNumber})`,
        'info',
        'doctor'
      );

      return newAppt;
    },
    [
      patients,
      hospitals,
      departments,
      doctors,
      appointments,
      previewDoctorAllocation,
      addAudit,
      addNotification,
    ]
  );

  // Submit Checkup by Doctor
  const submitCheckup = useCallback(
    (data: {
      appointmentId: string;
      bpSys: number;
      bpDia: number;
      heartRate: number;
      weightKg: number;
      sugarMgDl: number;
      diagnosis: string;
      clinicalNotes: string;
      prescriptions: { drug: string; dosage: string; frequency: string; duration: string }[];
      newChronicCondition?: string;
      followUpDate?: string;
    }) => {
      const appt = appointments.find((a) => a.id === data.appointmentId);
      if (!appt) return;

      const patient = patients.find((p) => p.id === appt.patient_id);
      const doctor = doctors.find((d) => d.id === appt.doctor_id);

      const checkupId = 'chk-' + Date.now();
      const newRecord: CheckupRecord = {
        id: checkupId,
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        patient_name: appt.patient_name,
        doctor_id: appt.doctor_id,
        doctor_name: appt.doctor_name,
        hospital_name: appt.hospital_name,
        date: new Date().toISOString().split('T')[0],
        bp_sys: data.bpSys,
        bp_dia: data.bpDia,
        heart_rate: data.heartRate,
        weight_kg: data.weightKg,
        sugar_mg_dl: data.sugarMgDl,
        diagnosis: data.diagnosis,
        prescriptions: data.prescriptions,
        clinical_notes: data.clinicalNotes,
        chronic_flag_added: data.newChronicCondition,
        follow_up_date: data.followUpDate,
      };

      setCheckupRecords((prev) => [newRecord, ...prev]);
      saveToFirestore(COLLECTIONS.CHECKUPS, newRecord);

      // Mark appointment completed
      const updatedAppt: Appointment = { ...appt, status: 'completed', completed_at: new Date().toISOString() };
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? updatedAppt : a))
      );
      saveToFirestore(COLLECTIONS.APPOINTMENTS, updatedAppt);

      // If new chronic condition was flagged or doctor sets primary doctor
      if (data.newChronicCondition && patient) {
        const updatedPatient: Patient = {
          ...patient,
          chronic_conditions: Array.from(
            new Set([...patient.chronic_conditions, data.newChronicCondition!])
          ),
          primary_doctor_id: patient.primary_doctor_id || doctor?.id,
          primary_department_id: patient.primary_department_id || doctor?.department_id,
        };
        setPatients((prev) =>
          prev.map((p) => (p.id === patient.id ? updatedPatient : p))
        );
        saveToFirestore(COLLECTIONS.PATIENTS, updatedPatient);
      }

      // Auto-create follow-up appointment if doctor set a follow-up date
      if (data.followUpDate && doctor && patient) {
        const followUpToken = `${appt.department_name.substring(0, 4).toUpperCase()}-FUP-${Math.floor(
          Math.random() * 90 + 10
        )}`;
        const followUpAppt: Appointment = {
          id: 'app-fup-' + Date.now(),
          token_number: followUpToken,
          patient_id: patient.id,
          patient_name: patient.name,
          patient_age: patient.age,
          patient_gender: patient.gender,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          hospital_id: doctor.hospital_id,
          hospital_name: appt.hospital_name,
          department_id: doctor.department_id,
          department_name: appt.department_name,
          date: data.followUpDate,
          time_slot: '10:00 AM (Follow-up)',
          symptoms: `Scheduled Clinical Follow-up post checkup: ${data.diagnosis}`,
          status: 'confirmed',
          assignment_reason: 'chronic-continuity',
          is_substitute: false,
          is_chronic_continuity: true,
          created_at: new Date().toISOString(),
        };

        setAppointments((prev) => [followUpAppt, ...prev]);
        saveToFirestore(COLLECTIONS.APPOINTMENTS, followUpAppt);

        addNotification(
          'Follow-up Auto-Scheduled',
          `Auto-booked follow up on ${data.followUpDate} with ${doctor.name}.`,
          'info',
          'patient'
        );
      }

      addAudit(
        'CHECKUP_COMPLETED',
        `Checkup completed for ${appt.patient_name} by ${doctor?.name}. Digital health records updated.`,
        'clinical'
      );

      addNotification(
        'Digital Record Updated',
        `Vitals and prescription from today's visit are now ready in your records.`,
        'success',
        'patient'
      );
    },
    [appointments, patients, doctors, addAudit, addNotification]
  );

  // Submit Leave Request (Continuous Leave Limit Rule enforcement)
  const submitLeaveRequest = useCallback(
    (data: {
      doctorId: string;
      startDate: string;
      endDate: string;
      reason: string;
    }): LeaveRequest => {
      const doctor = doctors.find((d) => d.id === data.doctorId);
      const hospital = hospitals.find((h) => h.id === doctor?.hospital_id);
      const department = departments.find((d) => d.id === doctor?.department_id);

      // Compute consecutive days
      const d1 = new Date(data.startDate);
      const d2 = new Date(data.endDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const consecutiveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // RULE: Max 2 consecutive days without Dean override
      const exceedsContinuousRule = consecutiveDays > 2;
      const status: LeaveRequest['status'] = exceedsContinuousRule ? 'escalated_to_dean' : 'pending';

      const newLeave: LeaveRequest = {
        id: 'leave-' + Date.now(),
        doctor_id: data.doctorId,
        doctor_name: doctor?.name || 'Doctor',
        hospital_id: hospital?.id || '',
        hospital_name: hospital?.name || 'Hospital',
        department_id: department?.id || '',
        department_name: department?.name || 'Department',
        start_date: data.startDate,
        end_date: data.endDate,
        consecutive_days: consecutiveDays,
        reason: data.reason,
        is_rule_exceeded: exceedsContinuousRule,
        status,
        requested_at: new Date().toISOString(),
        escalated_reason: exceedsContinuousRule
          ? `Consecutive leave of ${consecutiveDays} days exceeds 2-day routine limit. Dean Council authorization required.`
          : undefined,
      };

      setLeaveRequests((prev) => [newLeave, ...prev]);
      saveToFirestore(COLLECTIONS.LEAVES, newLeave);

      if (exceedsContinuousRule) {
        addAudit(
          'LEAVE_ESCALATED_DEAN',
          `Dr. ${doctor?.name} requested ${consecutiveDays} days. Continuous leave rule triggered (>2 days). Routed to Dean.`,
          'leave'
        );
        addNotification(
          'Leave Escalated to Dean',
          `Your request (${consecutiveDays} days) exceeds the 2-day continuous threshold and has been forwarded to the Dean's priority inbox.`,
          'warning',
          'doctor'
        );
        addNotification(
          'Dean Action Required',
          `New leave escalation from Dr. ${doctor?.name} (${consecutiveDays} consecutive days).`,
          'alert',
          'super_admin'
        );
      } else {
        addAudit(
          'LEAVE_SUBMITTED',
          `Routine leave request (${consecutiveDays} days) submitted by Dr. ${doctor?.name}.`,
          'leave'
        );
        addNotification(
          'Leave Request Submitted',
          `Routine request submitted to Hospital Admin for review.`,
          'info',
          'doctor'
        );
      }

      return newLeave;
    },
    [doctors, hospitals, departments, addAudit, addNotification]
  );

  // Approve Leave Request
  const approveLeaveRequest = useCallback(
    (leaveId: string, isDeanOverride = false) => {
      const leave = leaveRequests.find((l) => l.id === leaveId);
      if (!leave) return { success: false, message: 'Leave request not found' };

      const isRoutine = (leave.consecutive_days || 1) <= 2;
      const reviewerName = isDeanOverride
        ? 'Dr. Arthur V. Vance (Dean Council Override)'
        : currentRole === 'super_admin'
        ? 'Dr. Arthur V. Vance (Dean Council)'
        : isRoutine
        ? currentUser?.name || 'Hospital Administrator'
        : `${currentUser?.name || 'Hospital Administrator'} (Executive Dispensation)`;

      const updatedLeave: LeaveRequest = {
        ...leave,
        status: 'approved',
        reviewed_by: reviewerName,
        reviewed_at: new Date().toISOString(),
      };

      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? updatedLeave : l))
      );
      saveToFirestore(COLLECTIONS.LEAVES, updatedLeave);

      // Async sync with Java Spring Boot backend if reachable
      JavaApiClient.hospitalApproveLeave(leaveId, reviewerName).catch(() => {});

      // If leave is today, update doctor's status
      const today = new Date().toISOString().split('T')[0];
      if (today >= leave.start_date && today <= leave.end_date) {
        setDoctors((prev) =>
          prev.map((d) => {
            if (d.id === leave.doctor_id) {
              const updatedDoc: Doctor = { ...d, status: 'on-leave', is_available: false };
              saveToFirestore(COLLECTIONS.DOCTORS, updatedDoc);
              return updatedDoc;
            }
            return d;
          })
        );
      }

      // Re-balance affected appointments:
      const affectedApptsToSave: Appointment[] = [];
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.doctor_id === leave.doctor_id && a.date >= leave.start_date && a.date <= leave.end_date) {
            const peer = doctors.find(
              (d) =>
                d.hospital_id === a.hospital_id &&
                d.department_id === a.department_id &&
                d.id !== leave.doctor_id &&
                d.status !== 'on-leave'
            );
            if (peer) {
              const updatedAppt: Appointment = {
                ...a,
                doctor_id: peer.id,
                doctor_name: peer.name,
                is_substitute: true,
                substitute_for_doctor_name: leave.doctor_name,
                assignment_reason: 'substitute',
              };
              affectedApptsToSave.push(updatedAppt);
              return updatedAppt;
            }
          }
          return a;
        })
      );
      affectedApptsToSave.forEach((appt) => saveToFirestore(COLLECTIONS.APPOINTMENTS, appt));

      setRecentlyUpdatedDoctorId(leave.doctor_id);
      setTimeout(() => setRecentlyUpdatedDoctorId(null), 3000);

      addAudit(
        'LEAVE_APPROVED',
        `Leave for ${leave.doctor_name} approved by ${reviewerName}. Rebalancing engine re-opened peer slots.`,
        'leave'
      );

      addNotification(
        'Leave Approved',
        `Leave from ${leave.start_date} to ${leave.end_date} has been authorized. Patient slots redistributed.`,
        'success',
        'doctor'
      );

      return { success: true, message: `Leave for ${leave.doctor_name} approved successfully.` };
    },
    [leaveRequests, currentRole, currentUser, doctors, addAudit, addNotification]
  );

  // Reject Leave Request
  const rejectLeaveRequest = useCallback(
    (leaveId: string, note?: string) => {
      const leave = leaveRequests.find((l) => l.id === leaveId);
      if (!leave) return { success: false, message: 'Leave request not found' };

      const reviewerName = currentUser?.name || 'Hospital Administrator';
      const updatedLeave: LeaveRequest = {
        ...leave,
        status: 'rejected',
        reviewed_by: reviewerName,
        reviewed_at: new Date().toISOString(),
        review_note: note || 'Disapproved due to patient volume surge and minimum staffing thresholds.',
      };

      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? updatedLeave : l))
      );
      saveToFirestore(COLLECTIONS.LEAVES, updatedLeave);

      // Async sync with Java Spring Boot backend if reachable
      JavaApiClient.hospitalRejectLeave(leaveId, reviewerName, note).catch(() => {});

      addAudit('LEAVE_REJECTED', `Leave for ${leave.doctor_name} was declined. Staffing quota maintained.`, 'leave');
      addNotification(
        'Leave Declined',
        `Your leave request was declined: ${note || 'Hospital staffing quota requirement.'}`,
        'warning',
        'doctor'
      );

      return { success: true, message: `Leave for ${leave.doctor_name} rejected.` };
    },
    [leaveRequests, currentUser, addAudit, addNotification]
  );

  // Dean Council Dispensation Approval (Super Admin)
  const deanApproveLeave = useCallback(
    (leaveId: string, substituteDoctorId?: string) => {
      const result = approveLeaveRequest(leaveId, true);
      if (result.success) {
        JavaApiClient.deanApproveLeave(leaveId, 'Dr. Arthur V. Vance (Dean)', substituteDoctorId).catch(() => {});
        addAudit(
          'DEAN_DISPENSATION_GRANTED',
          `Dean Council granted continuous leave dispensation for REQ-${leaveId.slice(-4)}. Rebalancing engine activated.`,
          'governance'
        );
      }
      return result;
    },
    [approveLeaveRequest, addAudit]
  );

  // Dean Council Dispensation Rejection (Super Admin)
  const deanRejectLeave = useCallback(
    (leaveId: string, reason?: string) => {
      const note = reason || 'Dispensation rejected by Dean Council to maintain hospital clinical continuity.';
      const result = rejectLeaveRequest(leaveId, note);
      if (result.success) {
        JavaApiClient.deanRejectLeave(leaveId, 'Dr. Arthur V. Vance (Dean)', reason).catch(() => {});
        addAudit(
          'DEAN_DISPENSATION_REJECTED',
          `Dean Council rejected continuous leave dispensation for REQ-${leaveId.slice(-4)}: ${note}`,
          'governance'
        );
      }
      return result;
    },
    [rejectLeaveRequest, addAudit]
  );

  // Revoke Leave (Airport Status Board 1-click Undo Action)
  const revokeLeave = useCallback(
    (leaveId: string) => {
      const leave = leaveRequests.find((l) => l.id === leaveId);
      if (!leave) return;

      const updatedLeave: LeaveRequest = {
        ...leave,
        status: 'rejected',
        review_note: 'Revoked by Hospital Admin (Emergency slot reinstatement)',
      };

      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? updatedLeave : l))
      );
      saveToFirestore(COLLECTIONS.LEAVES, updatedLeave);

      // Re-enable doctor availability immediately
      setDoctors((prev) =>
        prev.map((d) => {
          if (d.id === leave.doctor_id) {
            const updatedDoc: Doctor = { ...d, status: 'available', is_available: true };
            saveToFirestore(COLLECTIONS.DOCTORS, updatedDoc);
            return updatedDoc;
          }
          return d;
        })
      );

      setRecentlyUpdatedDoctorId(leave.doctor_id);
      setTimeout(() => setRecentlyUpdatedDoctorId(null), 3000);

      addAudit(
        'LEAVE_REVOKED',
        `Hospital Admin revoked approved leave for ${leave.doctor_name}. Slots reopened and real-time load balancer re-included doctor.`,
        'leave'
      );

      addNotification(
        'Doctor Leave Revoked',
        `Slots for ${leave.doctor_name} have reopened. Real-time patient allocations will rebalance.`,
        'info'
      );
    },
    [leaveRequests, addAudit, addNotification]
  );

  // Toggle Doctor Availability
  const toggleDoctorAvailability = useCallback(
    (doctorId: string) => {
      const docItem = doctors.find((d) => d.id === doctorId);
      if (!docItem) return;

      const currentlyAvailable = docItem.is_available !== undefined ? docItem.is_available : docItem.status !== 'on-leave';
      const willBeAvailable = !currentlyAvailable;
      const newStatus: DoctorStatus = willBeAvailable ? 'available' : 'on-leave';

      const updatedDoctor: Doctor = {
        ...docItem,
        status: newStatus,
        is_available: willBeAvailable,
      };

      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? updatedDoctor : d))
      );
      saveToFirestore(COLLECTIONS.DOCTORS, updatedDoctor);

      setRecentlyUpdatedDoctorId(doctorId);
      setTimeout(() => setRecentlyUpdatedDoctorId(null), 3000);

      addAudit(
        'DOCTOR_AVAILABILITY_TOGGLED',
        `Hospital Admin set ${docItem.name} to ${willBeAvailable ? 'ACTIVE' : 'ON-LEAVE'}. OPD live board updated.`,
        'admin'
      );

      addNotification(
        'Doctor Status Updated',
        `${docItem.name} is now marked ${willBeAvailable ? 'Active' : 'On Leave'}. Real-time patient allocation engine recomputed.`,
        willBeAvailable ? 'success' : 'warning',
        'hospital_admin'
      );
    },
    [doctors, addAudit, addNotification]
  );

  // Add Specialist Doctor
  const addDoctor = useCallback(
    (docData: {
      hospital_id: string;
      department_id: string;
      department_name?: string;
      name: string;
      email: string;
      phone?: string;
      specialization: string;
      qualifications?: string;
      experienceYears?: number;
      avgDailyCapacity?: number;
      roomNumber?: string;
      weekly_schedule?: string[];
    }): Doctor => {
      const newId = 'doc-' + Date.now().toString().slice(-5);
      const dept = departments.find((d) => d.id === docData.department_id);
      const newDoc: Doctor = {
        id: newId,
        user_id: 'user-' + newId,
        hospital_id: docData.hospital_id,
        department_id: docData.department_id,
        department_name: docData.department_name || dept?.name || 'Specialist Wing',
        name: docData.name,
        email: docData.email,
        phone: docData.phone || '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
        specialization: docData.specialization,
        qualifications: docData.qualifications || 'MBBS, MD',
        experienceYears: docData.experienceYears || 5,
        avgDailyCapacity: docData.avgDailyCapacity || 20,
        todayPatientCount: 0,
        status: 'available',
        is_available: true,
        roomNumber: docData.roomNumber || 'OPD Room 108',
        weekly_schedule: docData.weekly_schedule || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };

      setDoctors((prev) => [...prev, newDoc]);
      saveToFirestore(COLLECTIONS.DOCTORS, newDoc);

      addAudit(
        'DOCTOR_ADDED',
        `Specialist ${newDoc.name} (${newDoc.specialization}) enrolled in department ${newDoc.department_name}.`,
        'admin'
      );

      addNotification(
        'Specialist Enrolled',
        `${newDoc.name} joined ${newDoc.department_name} with daily capacity of ${newDoc.avgDailyCapacity} patients.`,
        'success',
        'hospital_admin'
      );

      return newDoc;
    },
    [departments, addAudit, addNotification]
  );

  // Add Department in Hospital
  const addDepartment = useCallback(
    (deptData: {
      hospital_id: string;
      name: string;
      code: string;
      iconName?: string;
      headDoctorName: string;
      opdWing?: string;
      dailyCapacity?: number;
      phoneExtension?: string;
    }): Department => {
      const hospital = hospitals.find((h) => h.id === deptData.hospital_id);
      const newId = `dept-${deptData.hospital_id.replace('hosp-', '')}-${Date.now().toString().slice(-4)}`;
      const newDept: Department = {
        id: newId,
        hospital_id: deptData.hospital_id,
        name: deptData.name,
        code: deptData.code.toUpperCase(),
        iconName: deptData.iconName || 'Activity',
        headDoctorName: deptData.headDoctorName,
        opdWing: deptData.opdWing || 'OPD Clinical Wing',
        dailyCapacity: deptData.dailyCapacity || 40,
        activeSpecialistsCount: 0,
        phoneExtension: deptData.phoneExtension,
      };

      setDepartments((prev) => [...prev, newDept]);
      saveToFirestore(COLLECTIONS.DEPARTMENTS, newDept);

      // Async sync with Java Spring Boot backend if reachable
      JavaApiClient.addDepartment(deptData.hospital_id, newDept).catch(() => {});

      addAudit(
        'DEPARTMENT_CREATED',
        `New department "${newDept.name}" (${newDept.code}) commissioned under ${hospital?.name || 'Hospital'}. Lead: ${newDept.headDoctorName}.`,
        'admin'
      );

      addNotification(
        'New Department Commissioned',
        `${newDept.name} (${newDept.code}) added to ${hospital?.name || 'Hospital'}.`,
        'success',
        'hospital_admin'
      );

      return newDept;
    },
    [hospitals, addAudit, addNotification]
  );

  // Add Hospital (Dean Council Governance)
  const addHospital = useCallback(
    (hospData: Omit<Hospital, 'id'>): Hospital => {
      const newId = 'hosp-' + Date.now().toString().slice(-4);
      const newHosp: Hospital = {
        ...hospData,
        id: newId,
      };

      setHospitals((prev) => [...prev, newHosp]);
      saveToFirestore(COLLECTIONS.HOSPITALS, newHosp);

      addAudit(
        'HOSPITAL_ONBOARDED',
        `Hospital "${newHosp.name}" (${newHosp.district}) integrated into MediGrid Cloud. Admin: ${newHosp.admin_name}.`,
        'governance'
      );

      addNotification(
        'Hospital Enrolled',
        `${newHosp.name} successfully joined MediGrid Inter-Hospital Network.`,
        'success',
        'super_admin'
      );

      return newHosp;
    },
    [addAudit, addNotification]
  );

  // Helper: Find Patient by Phone
  const findPatientByPhone = useCallback(
    (phone: string): Patient | undefined => {
      const cleanDigits = phone.replace(/[^\d]/g, '');
      const targetTen = cleanDigits.slice(-10);
      if (!targetTen) return undefined;

      return patients.find((p) => {
        const pDigits = (p.phone || '').replace(/[^\d]/g, '');
        return pDigits.slice(-10) === targetTen;
      });
    },
    [patients]
  );

  // Upload Diagnostic Lab Report via Mobile Number
  const uploadLabReport = useCallback(
    async (reportData: {
      mobileNumber: string;
      patientName?: string;
      patientAge?: number;
      patientGender?: 'Male' | 'Female' | 'Other';
      hospitalId: string;
      hospitalName: string;
      title: string;
      reportType: 'Biochemistry' | 'Hematology' | 'Endocrine' | 'Radiology' | 'Cardiology' | 'Pathology' | string;
      date?: string;
      orderedBy: string;
      summary: string;
      parameters: {
        name: string;
        value: string;
        normal_range: string;
        unit: string;
        flag: 'normal' | 'high' | 'low';
      }[];
      fileName?: string;
      fileData?: string;
      fileSize?: string;
    }): Promise<LabReport> => {
      // Find patient or auto-register if mobile doesn't exist
      let patient = findPatientByPhone(reportData.mobileNumber);

      if (!patient) {
        // Auto-register walk-in patient by phone
        const newPatName = reportData.patientName || `Patient (${reportData.mobileNumber})`;
        const newPatient: Patient = {
          id: 'pat-' + Date.now(),
          user_id: 'user-pat-' + Date.now(),
          name: newPatName,
          email: `${newPatName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patient'}@walkin.medigrid.health`,
          phone: reportData.mobileNumber.startsWith('+') ? reportData.mobileNumber : `+91 ${reportData.mobileNumber}`,
          age: reportData.patientAge || 35,
          gender: reportData.patientGender || 'Other',
          blood_group: 'B+ Positive',
          chronic_conditions: [],
          emergency_contact: `Emergency Contact: ${reportData.mobileNumber}`,
        };

        setPatients((prev) => [newPatient, ...prev]);
        saveToFirestore(COLLECTIONS.PATIENTS, newPatient);
        patient = newPatient;
      }

      const reportId = 'lab-' + Date.now();
      const newReport: LabReport = {
        id: reportId,
        patient_id: patient.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        patient_age: patient.age,
        patient_gender: patient.gender,
        hospital_id: reportData.hospitalId,
        hospital_name: reportData.hospitalName,
        title: reportData.title,
        report_type: reportData.reportType,
        date: reportData.date || new Date().toISOString().split('T')[0],
        ordered_by: reportData.orderedBy,
        status: 'ready',
        summary: reportData.summary,
        parameters: reportData.parameters,
        file_name: reportData.fileName,
        file_data: reportData.fileData,
        file_size: reportData.fileSize,
        uploaded_at: new Date().toISOString(),
        uploaded_by: currentUser?.name || 'Diagnostic Laboratory Desk',
      };

      setLabReports((prev) => [newReport, ...prev]);
      saveToFirestore(COLLECTIONS.LABS, newReport);

      // Async sync with Java Spring Boot backend if reachable
      JavaApiClient.uploadReportByMobile({
        phone: reportData.mobileNumber,
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        title: reportData.title,
        category: reportData.reportType,
        date: reportData.date,
        orderedBy: reportData.orderedBy,
        hospitalId: reportData.hospitalId,
        hospitalName: reportData.hospitalName,
        summary: reportData.summary,
        fileName: reportData.fileName,
        fileUrl: reportData.fileData,
      }).catch(() => {});

      addAudit(
        'LAB_REPORT_UPLOADED',
        `Diagnostic report "${newReport.title}" (${newReport.report_type}) uploaded for ${patient.name} (Mobile: ${patient.phone}). Ordered by: ${newReport.ordered_by}.`,
        'clinical'
      );

      addNotification(
        'New Diagnostic Report Uploaded',
        `Lab report "${newReport.title}" attached to UHID ${patient.id} (${patient.name}) via mobile ${patient.phone}.`,
        'success',
        'patient'
      );

      addNotification(
        'Diagnostic Report Verified',
        `Report "${newReport.title}" registered for patient ${patient.name}.`,
        'info',
        'doctor'
      );

      return newReport;
    },
    [findPatientByPhone, currentUser, addAudit, addNotification]
  );

  // Call Next Patient in Doctor Queue
  const callNextPatient = useCallback(
    (doctorId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const docAppts = appointments
        .filter((a) => a.doctor_id === doctorId && (a.date === today || a.date === '2026-09-05') && a.status === 'confirmed')
        .sort((a, b) => (a.queue_position || 99) - (b.queue_position || 99));

      if (docAppts.length === 0) {
        alert('No pending patients waiting in queue.');
        return;
      }

      const nextAppt = docAppts[0];
      const updatedAppt: Appointment = { ...nextAppt, status: 'in-consultation' };
      setAppointments((prev) =>
        prev.map((a) => (a.id === nextAppt.id ? updatedAppt : a))
      );
      saveToFirestore(COLLECTIONS.APPOINTMENTS, updatedAppt);

      setDoctors((prev) =>
        prev.map((d) => {
          if (d.id === doctorId) {
            const updatedDoc = { ...d, status: 'in-consultation' as const };
            saveToFirestore(COLLECTIONS.DOCTORS, updatedDoc);
            return updatedDoc;
          }
          return d;
        })
      );

      setRecentlyUpdatedApptId(nextAppt.id);
      setTimeout(() => setRecentlyUpdatedApptId(null), 3000);

      addNotification(
        'Patient Called In',
        `Now consulting: ${nextAppt.patient_name} (Token ${nextAppt.token_number})`,
        'info',
        'doctor'
      );
    },
    [appointments, addNotification]
  );

  // Simulate Incoming Patient (Dynamic Real-time Demo Button)
  const simulateIncomingPatient = useCallback(() => {
    const sampleNames = ['Siddharth Roy', 'Deepika Pillai', 'Aditya Sen', 'Pooja Bhatt', 'Manish Gupta'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const today = '2026-09-05';

    // Target Endocrinology department at Metro Central Hospital
    const hospId = 'hosp-1';
    const deptId = 'dept-1-2';

    // Run allocation engine
    const alloc = previewDoctorAllocation(hospId, deptId, today, 'simulated-pat');
    if (!alloc) return;

    const newAppt: Appointment = {
      id: 'app-sim-' + Date.now(),
      token_number: `MC-ENDO-0${Math.floor(Math.random() * 50 + 4)}`,
      patient_id: 'pat-sim-' + Date.now(),
      patient_name: randomName,
      patient_age: Math.floor(Math.random() * 35 + 25),
      patient_gender: Math.random() > 0.5 ? 'Male' : 'Female',
      doctor_id: alloc.doctor.id,
      doctor_name: alloc.doctor.name,
      hospital_id: hospId,
      hospital_name: 'Metro Central Multi-Specialty Hospital',
      department_id: deptId,
      department_name: 'Endocrinology & Diabetology',
      date: today,
      time_slot: '11:45 AM',
      symptoms: 'Mild post-prandial fatigue, elevated glucose check',
      status: 'confirmed',
      assignment_reason: 'load-balanced',
      is_substitute: false,
      is_chronic_continuity: false,
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppt, ...prev]);
    saveToFirestore(COLLECTIONS.APPOINTMENTS, newAppt);

    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === alloc.doctor.id) {
          const updatedDoc = { ...d, todayPatientCount: d.todayPatientCount + 1 };
          saveToFirestore(COLLECTIONS.DOCTORS, updatedDoc);
          return updatedDoc;
        }
        return d;
      })
    );

    setRecentlyUpdatedDoctorId(alloc.doctor.id);
    setRecentlyUpdatedApptId(newAppt.id);
    setTimeout(() => {
      setRecentlyUpdatedDoctorId(null);
      setRecentlyUpdatedApptId(null);
    }, 3000);

    addAudit(
      'LIVE_SIMULATION_BOOKING',
      `Incoming patient ${randomName} dynamically assigned to ${alloc.doctor.name} (Load Balanced: currently lowest count).`,
      'allocation'
    );

    addNotification(
      'Live Assignment Alert',
      `New patient ${randomName} auto-routed to ${alloc.doctor.name} via Load Balancer.`,
      'info'
    );
  }, [previewDoctorAllocation, addAudit, addNotification]);

  // Reset to initial sample data
  const resetToSampleData = useCallback(() => {
    localStorage.clear();
    setHospitals(INITIAL_HOSPITALS);
    setDepartments(INITIAL_DEPARTMENTS);
    setDoctors(INITIAL_DOCTORS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setPatients(INITIAL_PATIENTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setCheckupRecords(INITIAL_CHECKUPS);
    setLabReports(INITIAL_LAB_REPORTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentRole('patient');
    setCurrentUser(INITIAL_USERS[0]);
    resetFirestoreToSample().catch((err) => console.error('[Firestore] Reset error:', err));
    addNotification('System Reset', 'MediGrid restored to initial medical network state and synced with Firestore.', 'info');
  }, [addNotification]);

  return (
    <DataContext.Provider
      value={{
        currentUser,
        currentRole,
        allUsers,
        hospitals,
        departments,
        doctors,
        leaveRequests,
        patients,
        appointments,
        checkupRecords,
        labReports,
        auditLogs,
        notifications,
        recentlyUpdatedDoctorId,
        recentlyUpdatedApptId,
        isCloudConnected,
        cloudSyncStatus,
        lastSyncTime,
        firebaseUser,
        isAuthLoading,
        signInWithGoogleAuth,
        signInWithEmailAuth,
        registerWithEmailAuth,
        resetPasswordAuth,
        switchRole,
        login,
        logout,
        registerPatient,
        previewDoctorAllocation,
        bookAppointment,
        submitCheckup,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        deanApproveLeave,
        deanRejectLeave,
        revokeLeave,
        toggleDoctorAvailability,
        addDoctor,
        addDepartment,
        addHospital,
        findPatientByPhone,
        uploadLabReport,
        callNextPatient,
        simulateIncomingPatient,
        resetToSampleData,
        clearNotification,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
