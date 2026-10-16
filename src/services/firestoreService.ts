import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Hospital,
  Department,
  Doctor,
  LeaveRequest,
  Patient,
  Appointment,
  CheckupRecord,
  LabReport,
  AuditLog,
  User,
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

// Firestore collection keys
export const COLLECTIONS = {
  HOSPITALS: 'hospitals',
  DEPARTMENTS: 'departments',
  DOCTORS: 'doctors',
  LEAVES: 'leave_requests',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  CHECKUPS: 'checkup_records',
  LABS: 'lab_reports',
  AUDITS: 'audit_logs',
  CUSTOM_USERS: 'custom_users',
  SYSTEM_META: 'system_metadata',
} as const;

/**
 * Strips undefined values from an object or replaces with null
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = null;
      }
    }
    return clean as T;
  }
  return data;
}

/**
 * Check and bootstrap initial records into Firestore if not present
 */
export async function seedInitialFirestoreData(): Promise<boolean> {
  try {
    const hospitalsSnap = await getDocs(collection(db, COLLECTIONS.HOSPITALS));
    if (!hospitalsSnap.empty) {
      // Database already seeded
      return false;
    }

    console.log('[Firestore] Seeding initial database records...');

    // Batch 1: Hospitals & Departments
    const batch1 = writeBatch(db);
    INITIAL_HOSPITALS.forEach((h) => {
      batch1.set(doc(db, COLLECTIONS.HOSPITALS, h.id), sanitizeForFirestore(h));
    });
    INITIAL_DEPARTMENTS.forEach((d) => {
      batch1.set(doc(db, COLLECTIONS.DEPARTMENTS, d.id), sanitizeForFirestore(d));
    });
    await batch1.commit();

    // Batch 2: Doctors & Patients
    const batch2 = writeBatch(db);
    INITIAL_DOCTORS.forEach((docItem) => {
      batch2.set(doc(db, COLLECTIONS.DOCTORS, docItem.id), sanitizeForFirestore(docItem));
    });
    INITIAL_PATIENTS.forEach((p) => {
      batch2.set(doc(db, COLLECTIONS.PATIENTS, p.id), sanitizeForFirestore(p));
    });
    await batch2.commit();

    // Batch 3: Appointments, Checkups, Leaves
    const batch3 = writeBatch(db);
    INITIAL_APPOINTMENTS.forEach((a) => {
      batch3.set(doc(db, COLLECTIONS.APPOINTMENTS, a.id), sanitizeForFirestore(a));
    });
    INITIAL_CHECKUPS.forEach((c) => {
      batch3.set(doc(db, COLLECTIONS.CHECKUPS, c.id), sanitizeForFirestore(c));
    });
    INITIAL_LEAVE_REQUESTS.forEach((l) => {
      batch3.set(doc(db, COLLECTIONS.LEAVES, l.id), sanitizeForFirestore(l));
    });
    await batch3.commit();

    // Batch 4: Lab Reports, Audits, Meta
    const batch4 = writeBatch(db);
    INITIAL_LAB_REPORTS.forEach((lr) => {
      batch4.set(doc(db, COLLECTIONS.LABS, lr.id), sanitizeForFirestore(lr));
    });
    INITIAL_AUDIT_LOGS.forEach((al) => {
      batch4.set(doc(db, COLLECTIONS.AUDITS, al.id), sanitizeForFirestore(al));
    });
    INITIAL_USERS.forEach((u) => {
      batch4.set(doc(db, COLLECTIONS.CUSTOM_USERS, u.id), sanitizeForFirestore(u));
    });
    batch4.set(doc(db, COLLECTIONS.SYSTEM_META, 'initialization'), {
      initializedAt: new Date().toISOString(),
      network: 'MediGrid Healthcare Cloud',
      status: 'active',
    });
    await batch4.commit();

    console.log('[Firestore] Successfully seeded all initial records.');
    return true;
  } catch (error) {
    console.error('[Firestore] Error seeding initial data:', error);
    return false;
  }
}

/**
 * Save single document to Firestore
 */
export async function saveToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, sanitizeForFirestore(item), { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Failed to save document to ${collectionName}/${item.id}:`, err);
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteFromFirestore(collectionName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err) {
    console.warn(`[Firestore] Failed to delete document from ${collectionName}/${docId}:`, err);
  }
}

/**
 * Batch save items to Firestore
 */
export async function batchSaveToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      batch.set(doc(db, collectionName, item.id), sanitizeForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn(`[Firestore] Failed to batch save to ${collectionName}:`, err);
  }
}

/**
 * Generic real-time collection subscription
 */
export function subscribeToFirestoreCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ ...d.data() }) as T);
      onUpdate(items);
    },
    (err) => {
      console.warn(`[Firestore] Subscription error for ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Reset all collections in Firestore to sample data
 */
export async function resetFirestoreToSample(): Promise<void> {
  try {
    console.log('[Firestore] Resetting database to sample data...');

    const collectionsToClear = [
      COLLECTIONS.HOSPITALS,
      COLLECTIONS.DEPARTMENTS,
      COLLECTIONS.DOCTORS,
      COLLECTIONS.LEAVES,
      COLLECTIONS.PATIENTS,
      COLLECTIONS.APPOINTMENTS,
      COLLECTIONS.CHECKUPS,
      COLLECTIONS.LABS,
      COLLECTIONS.AUDITS,
      COLLECTIONS.CUSTOM_USERS,
    ];

    // Wipe existing
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const delBatch = writeBatch(db);
        snap.docs.forEach((d) => delBatch.delete(d.ref));
        await delBatch.commit();
      }
    }

    // Re-seed
    await seedInitialFirestoreData();
  } catch (err) {
    console.error('[Firestore] Error resetting database:', err);
    throw err;
  }
}
