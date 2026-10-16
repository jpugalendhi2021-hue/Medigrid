import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  Heart,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Pill,
  Plus,
  Scale,
  Send,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { Appointment, CheckupRecord } from '../types';

export const DoctorView: React.FC = () => {
  const {
    currentUser,
    doctors,
    appointments,
    checkupRecords,
    leaveRequests,
    submitCheckup,
    submitLeaveRequest,
    callNextPatient,
    recentlyUpdatedApptId,
  } = useData();

  // Find active doctor
  const currentDoctor =
    doctors.find(
      (d) =>
        d.user_id === currentUser?.id ||
        d.id === currentUser?.id ||
        d.email.toLowerCase() === currentUser?.email?.toLowerCase()
    ) || doctors[0]; // defaults to Dr. Priya Rao

  // Active view tab
  const [activeTab, setActiveTab] = useState<'queue' | 'leave' | 'history'>('queue');

  // Checkup Entry Drawer state
  const [selectedApptForCheckup, setSelectedApptForCheckup] = useState<Appointment | null>(null);

  // Vitals entry form states
  const [bpSys, setBpSys] = useState<string>('');
  const [bpDia, setBpDia] = useState<string>('');
  const [sugar, setSugar] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [hr, setHr] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [newChronicCondition, setNewChronicCondition] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-09-19');
  const [prescriptions, setPrescriptions] = useState<
    { drug: string; dosage: string; frequency: string; duration: string }[]
  >([
    { drug: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily after meals', duration: '90 days' },
  ]);

  // Leave Form state
  const [leaveStartDate, setLeaveStartDate] = useState('2026-09-12');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-09-13');
  const [leaveReason, setLeaveReason] = useState('');

  // Doctor's today queue
  const today = '2026-09-05';
  const doctorAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => a.doctor_id === currentDoctor.id && (a.date === today || a.date === '2026-09-05')
      ),
    [appointments, currentDoctor]
  );

  const pendingQueue = doctorAppointments.filter((a) => a.status === 'confirmed');
  const inConsultationAppt = doctorAppointments.find((a) => a.status === 'in-consultation');
  const completedToday = doctorAppointments.filter((a) => a.status === 'completed');

  // Past checkups recorded by this doctor
  const doctorRecords = useMemo(
    () => checkupRecords.filter((c) => c.doctor_id === currentDoctor.id),
    [checkupRecords, currentDoctor]
  );

  // Leave requests for this doctor
  const myLeaves = useMemo(
    () => leaveRequests.filter((l) => l.doctor_id === currentDoctor.id),
    [leaveRequests, currentDoctor]
  );

  // Compute consecutive days for leave request preview
  const leaveDaysCount = useMemo(() => {
    if (!leaveStartDate || !leaveEndDate) return 1;
    const d1 = new Date(leaveStartDate);
    const d2 = new Date(leaveEndDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStartDate, leaveEndDate]);

  const tripsConsecutiveRule = leaveDaysCount > 2;

  // Previous visit vitals for the active patient (for pre-filling & real-time delta calculations!)
  const patientPastRecords = useMemo(() => {
    if (!selectedApptForCheckup) return [];
    return checkupRecords.filter((c) => c.patient_id === selectedApptForCheckup.patient_id);
  }, [checkupRecords, selectedApptForCheckup]);

  const lastVisit = patientPastRecords[patientPastRecords.length - 1];

  // Open checkup form for an appointment
  const handleOpenCheckup = (appt: Appointment) => {
    setSelectedApptForCheckup(appt);
    setBpSys('');
    setBpDia('');
    setSugar('');
    setWeight('');
    setHr('');
    setDiagnosis(appt.symptoms || '');
    setClinicalNotes('');
    setNewChronicCondition('');
    setFollowUpDate('2026-09-19');
    setPrescriptions([
      { drug: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily after meals', duration: '90 days' },
    ]);
  };

  const handleAddPrescriptionRow = () => {
    setPrescriptions((prev) => [
      ...prev,
      { drug: '', dosage: '', frequency: 'Once daily', duration: '30 days' },
    ]);
  };

  const handleRemovePrescriptionRow = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Checkup
  const handleSaveCheckup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForCheckup) return;

    submitCheckup({
      appointmentId: selectedApptForCheckup.id,
      bpSys: Number(bpSys) || lastVisit?.bp_sys || 120,
      bpDia: Number(bpDia) || lastVisit?.bp_dia || 80,
      heartRate: Number(hr) || lastVisit?.heart_rate || 72,
      weightKg: Number(weight) || lastVisit?.weight_kg || 75,
      sugarMgDl: Number(sugar) || lastVisit?.sugar_mg_dl || 110,
      diagnosis: diagnosis || 'Clinical evaluation & health review',
      clinicalNotes: clinicalNotes || 'Patient evaluated and vitals documented.',
      prescriptions: prescriptions.filter((p) => p.drug.trim().length > 0),
      newChronicCondition: newChronicCondition.trim() ? newChronicCondition : undefined,
      followUpDate: followUpDate || undefined,
    });

    setSelectedApptForCheckup(null);
  };

  // Submit Leave
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('Please provide a reason for leave.');
      return;
    }
    submitLeaveRequest({
      doctorId: currentDoctor.id,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
    });
    setLeaveReason('');
    alert(
      tripsConsecutiveRule
        ? 'Leave request spans more than 2 consecutive days. Automatically flagged & escalated to Dean Council.'
        : 'Routine leave request submitted to Hospital Admin for approval.'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Doctor Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            {currentDoctor.name.split(' ')[1]?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{currentDoctor.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                {currentDoctor.roomNumber}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{currentDoctor.specialization}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">{currentDoctor.experienceYears} Yrs Exp</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{currentDoctor.qualifications}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Duty Days:</span>
              <div className="flex gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                  const active = currentDoctor.weekly_schedule.includes(day);
                  return (
                    <span
                      key={day}
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        active ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => callNextPatient(currentDoctor.id)}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Call Next Patient</span>
          </button>
        </div>
      </div>

      {/* High Density KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Total Queue</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 leading-none">{doctorAppointments.length}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">CAPACITY: {currentDoctor.avgDailyCapacity} SLOTS</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">In Consultation</div>
          <div className="text-xl font-bold font-mono text-teal-600 mt-1 leading-none">
            {inConsultationAppt ? 1 : 0}
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-1 truncate">
            {inConsultationAppt ? inConsultationAppt.patient_name : 'No active session'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waiting in Queue</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1 leading-none">{pendingQueue.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Next in line waiting</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Today</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1 leading-none">{completedToday.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Records synchronized</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Today's Queue Timeline</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-teal-300">
            {doctorAppointments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'leave'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Schedule & Leave Planning
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>My Checkup Logs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {doctorRecords.length}
          </span>
        </button>
      </div>

      {/* TAB 1: VERTICAL TIMELINE QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Live OPD Queue Timeline</h2>
              <p className="text-xs text-slate-500">
                Vertical clinical queue with live position marker ("You are here")
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Date: {today}</span>
          </div>

          {doctorAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
              No appointments slotted for today yet.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              
              {/* CURRENT PATIENT IN CONSULTATION (Highlighted Position Marker) */}
              {inConsultationAppt && (
                <div className="relative animate-in fade-in">
                  {/* Glowing Position Marker */}
                  <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-teal-600 ring-4 ring-teal-100 flex items-center justify-center text-white shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-teal-500 bg-teal-50/40 shadow-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded bg-teal-700 text-white text-xs font-mono font-bold">
                          {inConsultationAppt.token_number}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900">
                            {inConsultationAppt.patient_name}
                          </span>
                          <span className="text-xs text-slate-500 ml-1.5">
                            ({inConsultationAppt.patient_gender}, {inConsultationAppt.patient_age} yrs)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                          YOU ARE HERE • IN CONSULTATION
                        </span>
                        <button
                          onClick={() => handleOpenCheckup(inConsultationAppt)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Fill Checkup Form</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-teal-200">
                      <span className="font-semibold text-slate-800">Presented Symptoms: </span>
                      {inConsultationAppt.symptoms}
                    </div>

                    {inConsultationAppt.assignment_reason === 'chronic-continuity' && (
                      <div className="text-[11px] text-teal-800 flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Chronic Care Continuity: Regular follow-up patient</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PENDING WAITING PATIENTS */}
              {pendingQueue.map((appt, idx) => {
                const isRecentlyUpdated = recentlyUpdatedApptId === appt.id;
                return (
                  <div key={appt.id} className="relative">
                    {/* Circle Node on Timeline */}
                    <div className="absolute -left-6 sm:-left-8 top-2 w-4 h-4 rounded-full bg-white border-2 border-slate-400"></div>

                    <div
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isRecentlyUpdated
                          ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-300'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-mono font-bold">
                            {appt.token_number}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900">{appt.patient_name}</span>
                            <span className="text-xs text-slate-500 ml-1.5">
                              ({appt.patient_gender}, {appt.patient_age} yrs)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {appt.time_slot}
                          </span>
                          <button
                            onClick={() => handleOpenCheckup(appt)}
                            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-teal-600 hover:text-white text-slate-700 text-xs font-semibold transition"
                          >
                            Call & Examine
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 mt-2">
                        <span className="font-semibold text-slate-700">Reason: </span>
                        {appt.symptoms}
                      </div>

                      {/* Reason line */}
                      <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                        {appt.assignment_reason === 'chronic-continuity' ? (
                          <span className="text-teal-700 font-medium">★ Regular patient (Continuity of Care)</span>
                        ) : appt.is_substitute ? (
                          <span className="text-amber-700 font-medium">⚠ Assigned as substitute specialist</span>
                        ) : (
                          <span>Auto load-balanced slot</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* COMPLETED PATIENTS */}
              {completedToday.map((appt) => (
                <div key={appt.id} className="relative opacity-70 hover:opacity-100 transition">
                  <div className="absolute -left-6 sm:-left-8 top-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-slate-500 mr-2">
                        {appt.token_number}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{appt.patient_name}</span>
                      <span className="text-[11px] text-emerald-700 font-medium ml-2">✓ Consultation Completed</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {appt.completed_at ? new Date(appt.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAVE & SCHEDULE MANAGEMENT */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Leave Submission Form with Consecutive Day Visualizer */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Leave of Absence</h2>
              <p className="text-xs text-slate-500">
                Continuous-leave rule: requests &gt;2 consecutive days automatically escalate to the Dean Council
              </p>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* CONSECUTIVE-DAY LIMIT VISUALIZER (Surfaces rule directly before submit!) */}
              <div
                className={`p-3.5 rounded-xl border text-xs transition ${
                  tripsConsecutiveRule
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    {tripsConsecutiveRule ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    Total Duration: {leaveDaysCount} Consecutive Day{leaveDaysCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200">
                    Rule Limit: Max 2 Days
                  </span>
                </div>

                {tripsConsecutiveRule ? (
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <span className="font-bold">Automated Rule Flag:</span> This request exceeds the 2-day continuous threshold. The hospital administrator cannot approve it locally; it will be marked as <span className="font-semibold underline">“Requires Dean Approval”</span> and routed to the Super Admin's priority inbox.
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-800">
                    Within routine hospital threshold (≤2 days). Routes to Hospital Admin Col. Sanjeev Kapoor for standard review.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Leave / Duty Relinquishment
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Attending Academic Conference, Medical duty, Personal leave..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>
                  {tripsConsecutiveRule ? 'Submit for Dean Council Escalation' : 'Submit Routine Leave Request'}
                </span>
              </button>
            </form>
          </div>

          {/* Leave History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Leave Application History</h2>
              <p className="text-xs text-slate-500">Statuses tracked across Hospital Admin & Dean Council</p>
            </div>

            <div className="space-y-3">
              {myLeaves.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No leave requests on record</div>
              ) : (
                myLeaves.map((l) => (
                  <div key={l.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {l.start_date} → {l.end_date} ({l.consecutive_days} days)
                      </span>
                      {l.status === 'approved' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Approved
                        </span>
                      ) : l.status === 'escalated_to_dean' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Needs Dean Approval
                        </span>
                      ) : l.status === 'rejected' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          Pending Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{l.reason}</p>
                    {l.reviewed_by && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                        Reviewed by: {l.reviewed_by}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINICAL LOGS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Clinical Checkup Records</h2>
            <p className="text-xs text-slate-500">Historical diagnoses and prescriptions signed by {currentDoctor.name}</p>
          </div>

          <div className="space-y-3">
            {doctorRecords.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{rec.patient_name}</span>
                    <span className="text-xs text-slate-500 ml-2">Date: {rec.date}</span>
                  </div>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    BP {rec.bp_sys}/{rec.bp_dia} • Sugar {rec.sugar_mg_dl} mg/dL • Weight {rec.weight_kg} kg
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-800">Diagnosis: </span>
                  {rec.diagnosis}
                </div>
                {rec.clinical_notes && (
                  <div className="text-xs text-slate-600 italic">"{rec.clinical_notes}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKUP ENTRY MODAL / DRAWER (With Pre-filled Placeholders and Instant Delta Calculations) */}
      {selectedApptForCheckup && (
        <div
          id="checkup-modal-backdrop"
          onClick={() => setSelectedApptForCheckup(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="checkup-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col cursor-default"
          >
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                    {selectedApptForCheckup.token_number}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Clinical Checkup Entry: {selectedApptForCheckup.patient_name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedApptForCheckup.patient_gender}, {selectedApptForCheckup.patient_age} yrs • OPD Consultation
                </p>
              </div>
              <button
                type="button"
                id="close-checkup-modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApptForCheckup(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveCheckup} className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Prior Vitals Note */}
              {lastVisit && (
                <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Prior Visit Reference ({lastVisit.date}):</span>
                    <span className="font-mono ml-2">
                      BP {lastVisit.bp_sys}/{lastVisit.bp_dia} • Sugar {lastVisit.sugar_mg_dl} mg/dL • Weight {lastVisit.weight_kg} kg
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-700 uppercase font-semibold">Pre-Filled</span>
                </div>
              )}

              {/* VITALS GRID WITH INSTANT DELTA CALCULATION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Patient Vital Signs & Real-Time Deltas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* BP Systolic */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">BP Systolic</span>
                      {/* DELTA BADGE */}
                      {bpSys && lastVisit && (
                        <span
                          className={`text-[10px] font-bold font-mono px-1 rounded ${
                            Number(bpSys) > lastVisit.bp_sys
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {Number(bpSys) >= lastVisit.bp_sys ? `+${Number(bpSys) - lastVisit.bp_sys}` : `${Number(bpSys) - lastVisit.bp_sys}`}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={bpSys}
                      onChange={(e) => setBpSys(e.target.value)}
                      placeholder={lastVisit ? String(lastVisit.bp_sys) : '120'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* BP Diastolic */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">BP Diastolic</span>
                      {bpDia && lastVisit && (
                        <span
                          className={`text-[10px] font-bold font-mono px-1 rounded ${
                            Number(bpDia) > lastVisit.bp_dia
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {Number(bpDia) >= lastVisit.bp_dia ? `+${Number(bpDia) - lastVisit.bp_dia}` : `${Number(bpDia) - lastVisit.bp_dia}`}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={bpDia}
                      onChange={(e) => setBpDia(e.target.value)}
                      placeholder={lastVisit ? String(lastVisit.bp_dia) : '80'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Fasting Glucose */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">Sugar (mg/dL)</span>
                      {sugar && lastVisit && (
                        <span
                          className={`text-[10px] font-bold font-mono px-1 rounded ${
                            Number(sugar) > lastVisit.sugar_mg_dl
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {Number(sugar) >= lastVisit.sugar_mg_dl ? `+${Number(sugar) - lastVisit.sugar_mg_dl}` : `${Number(sugar) - lastVisit.sugar_mg_dl}`}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={sugar}
                      onChange={(e) => setSugar(e.target.value)}
                      placeholder={lastVisit ? String(lastVisit.sugar_mg_dl) : '110'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">Weight (kg)</span>
                      {weight && lastVisit && (
                        <span
                          className={`text-[10px] font-bold font-mono px-1 rounded ${
                            Number(weight) > lastVisit.weight_kg
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {(Number(weight) - lastVisit.weight_kg).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={lastVisit ? String(lastVisit.weight_kg) : '75.0'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Diagnosis & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes Mellitus with controlled normotensive profile"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Notes & Patient Guidance
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Patient responding well to current titration. Continue low-glycemic dietary regime."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Prescription Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    Prescription & Medication Orders
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionRow}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Drug
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((rx, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                      <input
                        type="text"
                        placeholder="Drug Name"
                        value={rx.drug}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, drug: val } : item))
                          );
                        }}
                        className="col-span-4 px-2 py-1.5 rounded border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={rx.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, dosage: val } : item))
                          );
                        }}
                        className="col-span-3 px-2 py-1.5 rounded border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={rx.frequency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, frequency: val } : item))
                          );
                        }}
                        className="col-span-3 px-2 py-1.5 rounded border border-slate-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePrescriptionRow(idx)}
                        className="col-span-2 text-rose-500 hover:text-rose-700 text-xs flex items-center justify-center p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Date (Auto-creates follow-up appointment with same doctor) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auto-Schedule Clinical Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Auto-reserves a follow-up slot with {currentDoctor.name}.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tag Chronic Condition (Continuity Override)
                  </label>
                  <input
                    type="text"
                    value={newChronicCondition}
                    onChange={(e) => setNewChronicCondition(e.target.value)}
                    placeholder="e.g. Type 2 Diabetes, Hypertension..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Locks this physician for future visits in this department.
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedApptForCheckup(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Record & Update Patient Trends</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
