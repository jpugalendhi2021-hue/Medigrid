/**
 * MediGrid Java Backend REST Client
 * Connects the React frontend to the Spring Boot REST API (default http://localhost:8080)
 */

const API_BASE_URL = ((import.meta as any).env?.VITE_JAVA_API_URL as string) || 'http://localhost:8080/api';

export const JavaApiClient = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Hospitals
  async getHospitals() {
    const res = await fetch(`${API_BASE_URL}/hospitals`);
    if (!res.ok) throw new Error('Failed to fetch hospitals from Java backend');
    return res.json();
  },

  // Doctors
  async getDoctors() {
    const res = await fetch(`${API_BASE_URL}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors from Java backend');
    return res.json();
  },

  // Doctor Allocation Preview
  async previewAllocation(payload: {
    patientId: string;
    hospitalId: string;
    departmentId: string;
    date: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/appointments/preview-allocation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to preview allocation from Java backend');
    return res.json();
  },

  // Book Appointment
  async bookAppointment(payload: any) {
    const res = await fetch(`${API_BASE_URL}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to book appointment on Java backend');
    return res.json();
  },

  // Submit Checkup Record
  async submitCheckup(payload: any) {
    const res = await fetch(`${API_BASE_URL}/appointments/submit-checkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit checkup on Java backend');
    return res.json();
  },

  // Leave Governance
  async submitLeave(payload: any) {
    const res = await fetch(`${API_BASE_URL}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit leave on Java backend');
    return res.json();
  },

  async hospitalApproveLeave(leaveId: string, adminName: string) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/hospital-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName }),
    });
    if (!res.ok) throw new Error('Failed to approve leave on Java backend');
    return res.json();
  },

  async hospitalRejectLeave(leaveId: string, adminName: string, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/hospital-reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName, reason }),
    });
    if (!res.ok) throw new Error('Failed to reject leave on Java backend');
    return res.json();
  },

  // Clinical Departments (Java Spring Boot)
  async addDepartment(hospitalId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add department on Java backend');
    return res.json();
  },

  // Patient Lookup & Mobile Report Dispatch (Java Spring Boot)
  async findPatientByPhone(phone: string) {
    const res = await fetch(`${API_BASE_URL}/patients/by-phone/${encodeURIComponent(phone)}`);
    if (!res.ok) return null;
    return res.json();
  },

  async uploadReportByMobile(payload: any) {
    const res = await fetch(`${API_BASE_URL}/patients/upload-report-by-mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to upload report by mobile on Java backend');
    return res.json();
  },

  async deanApproveLeave(leaveId: string, deanName: string, substituteDoctorId?: string) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/dean-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deanName, substituteDoctorId }),
    });
    if (!res.ok) throw new Error('Failed to approve dean leave on Java backend');
    return res.json();
  },

  async deanRejectLeave(leaveId: string, deanName: string, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/leaves/${leaveId}/dean-reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deanName, reason }),
    });
    if (!res.ok) throw new Error('Failed to reject dean leave on Java backend');
    return res.json();
  },
};
