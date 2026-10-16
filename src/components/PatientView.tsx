import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Pill,
  Plus,
  Scale,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { Sparkline, FullInteractiveChart } from './Sparkline';
import { Appointment, CheckupRecord, LabReport } from '../types';

export const PatientView: React.FC = () => {
  const {
    currentUser,
    patients,
    hospitals,
    departments,
    doctors,
    appointments,
    checkupRecords,
    labReports,
    previewDoctorAllocation,
    bookAppointment,
    recentlyUpdatedApptId,
  } = useData();

  // Find active patient record
  const currentPatient =
    patients.find(
      (p) =>
        p.user_id === currentUser?.id ||
        p.id === currentUser?.id ||
        p.email.toLowerCase() === currentUser?.email?.toLowerCase()
    ) || patients[0];

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'reports'>('dashboard');

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: District/Hosp/Dept, 2: Allocation Match, 3: Slot/Symptoms, 4: Confirmed
  const [selectedDistrict, setSelectedDistrict] = useState('Central District');
  const [selectedHospitalId, setSelectedHospitalId] = useState('hosp-1');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('dept-1-2');
  const [bookingDate, setBookingDate] = useState('2026-09-05');
  const [symptoms, setSymptoms] = useState('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(2); // 10:30 AM
  const [isMatching, setIsMatching] = useState(false);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [substituteChoice, setSubstituteChoice] = useState<'substitute' | 'wait_regular'>('substitute');
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Full Chart Modal state
  const [expandedChart, setExpandedChart] = useState<'bp' | 'sugar' | 'weight' | 'hr' | null>(null);

  // Lab Report Modal state
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  // Keyboard shortcut listener to close any active modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedChart) setExpandedChart(null);
        if (selectedReport) setSelectedReport(null);
        if (isBookingOpen) closeBookingModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedChart, selectedReport, isBookingOpen]);

  // Safe file downloader for lab reports (replaces sandboxed alert)
  const handleDownloadReport = (lab: LabReport) => {
    const content = [
      `MediGrid Healthcare System - Diagnostic Laboratory Asset`,
      `=======================================================`,
      `Test Name: ${lab.title}`,
      `Category: ${lab.report_type.toUpperCase()}`,
      `Verified Date: ${lab.date}`,
      `Ordering Physician: ${lab.ordered_by}`,
      `Facility: ${lab.hospital_name}`,
      `Patient Name: ${currentPatient.name} (${currentPatient.gender}, Age ${currentPatient.age})`,
      `Patient UHID: ${currentPatient.uhid}`,
      ``,
      `Clinical Summary & Impression:`,
      `${lab.summary}`,
      ``,
      `Observed Laboratory Parameters:`,
      ...lab.parameters.map(
        (p) =>
          ` - ${p.name.padEnd(25, ' ')} : ${String(p.value).padStart(6, ' ')} ${p.unit} (Ref: ${p.normal_range} ${p.unit}) [${p.flag.toUpperCase()}]`
      ),
      ``,
      `=======================================================`,
      `Official Digital Health Asset - Validated via MediGrid Inter-Hospital Network`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lab.title.replace(/\s+/g, '_')}_Official_Record.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter appointments for this patient
  const patientAppointments = useMemo(
    () =>
      appointments.filter((a) => a.patient_id === currentPatient.id || a.patient_name === currentPatient.name),
    [appointments, currentPatient]
  );

  const upcomingAppointments = patientAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const pastAppointments = patientAppointments.filter((a) => a.status === 'completed');

  // Filter records for this patient
  const patientRecords = useMemo(
    () =>
      checkupRecords.filter((c) => c.patient_id === currentPatient.id || c.patient_name === currentPatient.name),
    [checkupRecords, currentPatient]
  );

  // Filter lab reports
  const patientLabs = useMemo(
    () => labReports.filter((l) => l.patient_id === currentPatient.id),
    [labReports, currentPatient]
  );

  // Prepare trend data for sparklines & full chart
  const bpTrendData = patientRecords.map((r) => ({
    date: r.date,
    value: r.bp_sys,
    secondValue: r.bp_dia,
    note: r.clinical_notes,
    doctor: r.doctor_name,
  }));

  const sugarTrendData = patientRecords.map((r) => ({
    date: r.date,
    value: r.sugar_mg_dl,
    note: r.clinical_notes,
    doctor: r.doctor_name,
  }));

  const weightTrendData = patientRecords.map((r) => ({
    date: r.date,
    value: r.weight_kg,
    note: r.clinical_notes,
    doctor: r.doctor_name,
  }));

  const hrTrendData = patientRecords.map((r) => ({
    date: r.date,
    value: r.heart_rate,
    note: r.clinical_notes,
    doctor: r.doctor_name,
  }));

  // Primary doctor info
  const primaryDoctor = doctors.find((d) => d.id === currentPatient.primary_doctor_id);

  // Available districts
  const districts = Array.from(new Set(hospitals.map((h) => h.district)));

  // Available hospitals in district
  const availableHospitals = hospitals.filter((h) => h.district === selectedDistrict);

  // Available departments in hospital
  const availableDepartments = departments.filter((d) => d.hospital_id === selectedHospitalId);

  // Trigger allocation calculation with intentional sub-second loading state
  const handleProceedToMatching = () => {
    setIsMatching(true);
    setStep(2);
    // Sub-second intentional matching state
    setTimeout(() => {
      const res = previewDoctorAllocation(
        selectedHospitalId,
        selectedDepartmentId,
        bookingDate,
        currentPatient.id
      );
      setAllocationResult(res);
      setIsMatching(false);
    }, 700);
  };

  // Confirm booking
  const handleConfirmBooking = () => {
    const slots = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM'];
    const chosenSlot = slots[selectedSlotIndex] || '10:30 AM';

    const preferredDocId =
      substituteChoice === 'wait_regular' && allocationResult?.regularDoctor
        ? allocationResult.regularDoctor.id
        : undefined;

    const newAppt = bookAppointment({
      patientId: currentPatient.id,
      hospitalId: selectedHospitalId,
      departmentId: selectedDepartmentId,
      date: bookingDate,
      timeSlot: chosenSlot,
      symptoms: symptoms || 'General medical follow-up and review',
      preferredDoctorId: preferredDocId,
    });

    setConfirmedAppt(newAppt);
    setStep(4);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setStep(1);
    setSymptoms('');
    setConfirmedAppt(null);
    setAllocationResult(null);
  };

  // Dot representation for time slots (filled vs open dots)
  const slotDots = [
    { time: '09:00 AM', filled: true },
    { time: '09:45 AM', filled: true },
    { time: '10:30 AM', filled: false },
    { time: '11:15 AM', filled: false },
    { time: '02:00 PM', filled: true },
    { time: '02:45 PM', filled: false },
    { time: '03:30 PM', filled: false },
    { time: '04:15 PM', filled: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Patient Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            {currentPatient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{currentPatient.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {currentPatient.gender}, {currentPatient.age} YRS
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {currentPatient.blood_group}
              </span>
            </div>
            
            {/* Chronic Conditions & Continuity Badge */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {currentPatient.chronic_conditions?.map((cond) => (
                <span
                  key={cond}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                >
                  {cond}
                </span>
              ))}

              {/* Continuity of Care Badge */}
              {primaryDoctor && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold font-mono uppercase tracking-wider"
                  title="MediGrid allocation engine preserves this physician across all appointments in this department"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>CONTINUITY: {primaryDoctor.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setIsBookingOpen(true);
            setStep(1);
          }}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Smart OPD Appointment</span>
        </button>
      </div>

      {/* High Density Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview & Queue
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'records'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Digital Health Records</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {patientRecords.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Diagnostic Reports</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {patientLabs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STAT CARDS WITH SPARKLINE PREVIEWS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Blood Pressure Sparkline Card */}
            <div
              onClick={() => setExpandedChart('bp')}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Blood Pressure
                </span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {bpTrendData[bpTrendData.length - 1]?.value || 118}
                  <span className="text-sm font-normal text-slate-500">
                    /{bpTrendData[bpTrendData.length - 1]?.secondValue || 76}
                  </span>
                </span>
                <span className="text-xs text-slate-500">mmHg</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Sparkline data={bpTrendData} color="#e11d48" unit="mmHg" width={110} height={32} />
                <span className="text-[11px] text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Expand <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 2. Blood Sugar Sparkline Card */}
            <div
              onClick={() => setExpandedChart('sugar')}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fasting Blood Sugar
                </span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {sugarTrendData[sugarTrendData.length - 1]?.value || 122}
                </span>
                <span className="text-xs text-slate-500">mg/dL</span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                  <TrendingDown className="w-3 h-3" /> -20 mg/dL
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Sparkline data={sugarTrendData} color="#d97706" unit="mg/dL" width={110} height={32} />
                <span className="text-[11px] text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Expand <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 3. Weight Sparkline Card */}
            <div
              onClick={() => setExpandedChart('weight')}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Body Weight
                </span>
                <Scale className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {weightTrendData[weightTrendData.length - 1]?.value || 82.0}
                </span>
                <span className="text-xs text-slate-500">kg</span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                  <TrendingDown className="w-3 h-3" /> -2.5 kg
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Sparkline data={weightTrendData} color="#2563eb" unit="kg" width={110} height={32} />
                <span className="text-[11px] text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Expand <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 4. Heart Rate Sparkline Card */}
            <div
              onClick={() => setExpandedChart('hr')}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resting Heart Rate
                </span>
                <Heart className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {hrTrendData[hrTrendData.length - 1]?.value || 72}
                </span>
                <span className="text-xs text-slate-500">bpm</span>
                <span className="text-[11px] font-semibold text-slate-500">Normal Sinus</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Sparkline data={hrTrendData} color="#0d9488" unit="bpm" width={110} height={32} />
                <span className="text-[11px] text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  Expand <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* UPCOMING & LIVE QUEUE APPOINTMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming & Active OPD Appointments</h2>
                <p className="text-xs text-slate-500">
                  Live queue tokens, real-time doctor assignment reasons, and status tracking
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200">
                {upcomingAppointments.length} Scheduled
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-700">No appointments currently scheduled</div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Use the "Book Smart OPD Appointment" button to automatically match with an available specialist.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => {
                  const isRecentlyUpdated = recentlyUpdatedApptId === appt.id;
                  const isToday = appt.date === '2026-09-05';
                  return (
                    <div
                      key={appt.id}
                      className={`p-4 rounded-xl border transition-all duration-500 ${
                        isRecentlyUpdated
                          ? 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-300'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="px-3 py-2 rounded-lg bg-slate-900 text-white text-center shrink-0">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Token</div>
                            <div className="text-sm font-extrabold font-mono text-teal-300">{appt.token_number}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{appt.doctor_name}</span>
                              <span className="text-xs text-slate-500">• {appt.department_name}</span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {appt.hospital_name}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {appt.date} ({appt.time_slot})
                              </span>
                            </div>

                            {/* Intentional Reason Line */}
                            <div className="mt-2 text-xs flex items-center gap-1.5">
                              {appt.assignment_reason === 'chronic-continuity' ? (
                                <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded font-medium text-[11px]">
                                  <UserCheck className="w-3 h-3" />
                                  Your regular doctor — continuing your ongoing metabolic care
                                </span>
                              ) : appt.is_substitute ? (
                                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded font-medium text-[11px]">
                                  <AlertCircle className="w-3 h-3" />
                                  Substitute Physician (Regular specialist on leave this date)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-medium text-[11px]">
                                  <Sparkles className="w-3 h-3" />
                                  Assigned based on today's availability — auto load-balanced
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="text-right shrink-0">
                          {appt.status === 'in-consultation' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 animate-pulse border border-teal-300">
                              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                              In Consultation Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Confirmed in OPD Queue
                            </span>
                          )}
                          {isToday && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Queue position: <span className="font-bold text-slate-800">#{appt.queue_position || 1}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL HEALTH RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Longitudinal Clinical History</h2>
                <p className="text-xs text-slate-500">
                  Cumulative record generated automatically from doctor consultations
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {patientRecords.map((rec) => (
                <div key={rec.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{rec.diagnosis}</div>
                      <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-teal-700">{rec.doctor_name}</span>
                        <span>•</span>
                        <span>{rec.hospital_name}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-700 px-2.5 py-1 rounded bg-white border border-slate-200 shrink-0">
                      Visit Date: {rec.date}
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Blood Pressure</span>
                      <span className="font-bold font-mono text-slate-900">{rec.bp_sys}/{rec.bp_dia} mmHg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Fasting Sugar</span>
                      <span className="font-bold font-mono text-slate-900">{rec.sugar_mg_dl} mg/dL</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Body Weight</span>
                      <span className="font-bold font-mono text-slate-900">{rec.weight_kg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Heart Rate</span>
                      <span className="font-bold font-mono text-slate-900">{rec.heart_rate} bpm</span>
                    </div>
                  </div>

                  {/* Doctor Notes */}
                  {rec.clinical_notes && (
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 block mb-0.5">Clinical Evaluation Notes:</span>
                      <p className="italic text-slate-600">{rec.clinical_notes}</p>
                    </div>
                  )}

                  {/* Prescriptions Table */}
                  {rec.prescriptions?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        Prescribed Medications
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                              <th className="py-1.5 px-3">Medication</th>
                              <th className="py-1.5 px-3">Dosage</th>
                              <th className="py-1.5 px-3">Frequency</th>
                              <th className="py-1.5 px-3">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rec.prescriptions.map((rx, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-semibold text-slate-800">{rx.drug}</td>
                                <td className="py-2 px-3 text-slate-600 font-mono">{rx.dosage}</td>
                                <td className="py-2 px-3 text-slate-600">{rx.frequency}</td>
                                <td className="py-2 px-3 text-slate-600">{rx.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTIC LAB REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Diagnostic Laboratory Reports</h2>
              <p className="text-xs text-slate-500">
                Verified digital pathology & biochemistry panels
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientLabs.map((lab) => (
              <div key={lab.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      {lab.report_type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{lab.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{lab.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{lab.summary}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                    Ordered by: <span className="font-semibold text-slate-800">{lab.ordered_by}</span> ({lab.hospital_name})
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-200">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified & Signed
                  </span>
                  <button
                    onClick={() => setSelectedReport(lab)}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Parameters & PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FULL INTERACTIVE CHART */}
      {expandedChart && (
        <div
          id="expanded-chart-backdrop"
          onClick={() => setExpandedChart(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="expanded-chart-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 p-6 relative cursor-default"
          >
            <button
              type="button"
              id="close-expanded-chart-btn"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedChart(null);
              }}
              className="absolute top-4 right-4 z-40 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Close Chart"
              aria-label="Close interactive chart"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>

            {expandedChart === 'bp' && (
              <FullInteractiveChart
                title="Blood Pressure Longitudinal Trend"
                subtitle="Systolic and Diastolic trajectory plotted across verified doctor visit dates"
                data={bpTrendData}
                primaryLabel="Systolic (mmHg)"
                secondaryLabel="Diastolic (mmHg)"
                unit="mmHg"
                primaryColor="#e11d48"
                secondaryColor="#64748b"
                targetRange={{ min: 90, max: 120, label: 'Normotensive' }}
              />
            )}

            {expandedChart === 'sugar' && (
              <FullInteractiveChart
                title="Fasting Blood Glucose Longitudinal Trend"
                subtitle="Glycemic trajectory tracking response to dietary adjustments and titration"
                data={sugarTrendData}
                primaryLabel="Fasting Glucose (mg/dL)"
                unit="mg/dL"
                primaryColor="#d97706"
                targetRange={{ min: 70, max: 100, label: 'Normal Fasting' }}
              />
            )}

            {expandedChart === 'weight' && (
              <FullInteractiveChart
                title="Body Weight Longitudinal Trajectory"
                subtitle="Weight record recorded at OPD consultation check-ins"
                data={weightTrendData}
                primaryLabel="Weight (kg)"
                unit="kg"
                primaryColor="#2563eb"
              />
            )}

            {expandedChart === 'hr' && (
              <FullInteractiveChart
                title="Resting Heart Rate Trajectory"
                subtitle="Recorded during clinical vital signs measurement"
                data={hrTrendData}
                primaryLabel="Heart Rate (bpm)"
                unit="bpm"
                primaryColor="#0d9488"
                targetRange={{ min: 60, max: 100, label: 'Normal Resting' }}
              />
            )}
          </div>
        </div>
      )}

      {/* MODAL: LAB REPORT PARAMETERS */}
      {selectedReport && (
        <div
          id="lab-report-backdrop"
          onClick={() => setSelectedReport(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="lab-report-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 relative cursor-default"
          >
            <button
              type="button"
              id="close-lab-report-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(null);
              }}
              className="absolute top-4 right-4 z-40 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Close Report"
              aria-label="Close lab report"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                {selectedReport.report_type}
              </span>
              <span className="text-xs text-slate-500 font-mono">Date: {selectedReport.date}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{selectedReport.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordered by {selectedReport.ordered_by} • {selectedReport.hospital_name}
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-0.5">Pathologist Impression:</span>
              {selectedReport.summary}
            </div>

            {/* Parameters Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                    <th className="py-2 px-3">Test Parameter</th>
                    <th className="py-2 px-3">Observed Value</th>
                    <th className="py-2 px-3">Biological Reference</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReport.parameters.map((param, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{param.name}</td>
                      <td className="py-2 px-3 font-bold font-mono text-slate-900">
                        {param.value} <span className="text-[11px] font-normal text-slate-500">{param.unit}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {param.normal_range} {param.unit}
                      </td>
                      <td className="py-2 px-3">
                        {param.flag === 'normal' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Normal
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Elevated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">MediGrid Verified Digital Health Asset</span>
              <div className="flex items-center gap-2">
                {selectedReport.file_data && (
                  <a
                    href={selectedReport.file_data}
                    download={selectedReport.file_name || 'Medical_Report'}
                    className="px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {selectedReport.file_name || 'File'}</span>
                  </a>
                )}
                <button
                  type="button"
                  id="download-lab-report-btn"
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 pointer-events-none" />
                  <span>Download Official Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SMART BOOKING WIZARD (With Auto-Assignment, Intentional Loading, Reason Line, Substitute Callout, and Slot Dots) */}
      {isBookingOpen && (
        <div
          id="booking-modal-backdrop"
          onClick={closeBookingModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="booking-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col cursor-default"
          >
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Smart OPD Appointment Booking</h3>
                  <p className="text-xs text-slate-300">
                    Auto-allocation engine balances specialist workload & preserves continuous care
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-booking-modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  closeBookingModal();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Wizard Steps Navigation Bar */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
              <span className={step === 1 ? 'text-teal-700 font-bold' : ''}>1. Department & Date</span>
              <span>→</span>
              <span className={step === 2 ? 'text-teal-700 font-bold' : ''}>2. Doctor Matching</span>
              <span>→</span>
              <span className={step === 3 ? 'text-teal-700 font-bold' : ''}>3. Slot & Confirmation</span>
            </div>

            {/* Step 1: District -> Hospital -> Department -> Date */}
            {step === 1 && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* District */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        const firstHosp = hospitals.find((h) => h.district === e.target.value);
                        if (firstHosp) setSelectedHospitalId(firstHosp.id);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hospital */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Hospital
                    </label>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      {availableHospitals.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Medical Specialty / Department
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code}) — Head: {dept.headDoctorName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Appointment Date
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Today', date: '2026-09-05' },
                      { label: 'Tomorrow', date: '2026-09-06' },
                      { label: 'In 2 Days', date: '2026-09-07' },
                    ].map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setBookingDate(d.date)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                          bookingDate === d.date
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div>{d.label}</div>
                        <div className="text-[10px] font-normal text-slate-400">{d.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">Automatic Allocation:</span> You do not need to manually browse doctors. The system evaluates specialist leave statuses, current workload counts, and your personal continuity history.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleProceedToMatching}
                    className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2"
                  >
                    <span>Proceed to Doctor Matching</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Intentional Matching State & Reason Line Reveal */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                {isMatching ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping"></div>
                      <div className="relative w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg">
                        <Activity className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Matching you with the right doctor…</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Checking approved leaves, today's queue balance, and longitudinal continuity...
                      </p>
                    </div>
                  </div>
                ) : allocationResult ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    
                    {/* IF REGULAR DOCTOR IS ON LEAVE: Surface explicit callout with 2 clear choices */}
                    {allocationResult.regularDoctorOnLeave && allocationResult.regularDoctor ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm">
                              {allocationResult.regularDoctor.name} is on approved leave on {bookingDate}
                            </div>
                            <p className="text-xs text-amber-800 mt-0.5">
                              Your continuous-care physician is temporarily away. You can either consult today's load-balanced substitute or reserve the next available slot with your regular doctor.
                            </p>
                          </div>
                        </div>

                        {/* Two clear buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSubstituteChoice('substitute')}
                            className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition ${
                              substituteChoice === 'substitute'
                                ? 'bg-white border-amber-600 text-amber-900 shadow-xs ring-1 ring-amber-500'
                                : 'bg-amber-100/50 border-amber-200 text-amber-800 hover:bg-white'
                            }`}
                          >
                            <div className="font-bold">See Today's Substitute</div>
                            <div className="text-[11px] font-normal text-amber-700">
                              {allocationResult.doctor.name} (Lowest current OPD queue)
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSubstituteChoice('wait_regular');
                              setBookingDate('2026-09-08'); // Next return date
                            }}
                            className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition ${
                              substituteChoice === 'wait_regular'
                                ? 'bg-white border-amber-600 text-amber-900 shadow-xs ring-1 ring-amber-500'
                                : 'bg-amber-100/50 border-amber-200 text-amber-800 hover:bg-white'
                            }`}
                          >
                            <div className="font-bold">Wait for Regular Specialist</div>
                            <div className="text-[11px] font-normal text-amber-700">
                              Next available: 08 Sep with {allocationResult.regularDoctor.name}
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Revealed Doctor Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xl shrink-0">
                        {allocationResult.doctor.name.split(' ')[1]?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-base font-bold text-slate-900">
                              {substituteChoice === 'wait_regular' && allocationResult.regularDoctor
                                ? allocationResult.regularDoctor.name
                                : allocationResult.doctor.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              {substituteChoice === 'wait_regular' && allocationResult.regularDoctor
                                ? allocationResult.regularDoctor.specialization
                                : allocationResult.doctor.specialization}
                            </div>
                          </div>
                          <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                            {allocationResult.doctor.roomNumber}
                          </span>
                        </div>

                        {/* TRUST-BUILDING ONE-LINE REASON (Crucial requirement) */}
                        <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Allocation Reason
                          </span>
                          <span className="text-slate-800 font-semibold italic">
                            {allocationResult.reason === 'chronic-continuity' && !allocationResult.regularDoctorOnLeave
                              ? `“Your regular doctor — continuing your ongoing metabolic care”`
                              : substituteChoice === 'substitute' && allocationResult.regularDoctorOnLeave
                              ? `“Substitute specialist — Dr. Priya Rao is on approved leave today”`
                              : `“Assigned based on today's availability — load balanced across ${allocationResult.todayCount} active patients”`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        ← Change Department/Date
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2"
                      >
                        <span>Select Time Slot</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    No specialist available in this department for the chosen date.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Slot Dots & Symptoms */}
            {step === 3 && (
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Live Slot Availability (Filled vs Open Dots)
                    </label>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Booked
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Open Slot
                      </span>
                    </div>
                  </div>

                  {/* Slot Dots Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {slotDots.map((slot, idx) => {
                      const isSelected = selectedSlotIndex === idx;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={slot.filled}
                          onClick={() => setSelectedSlotIndex(idx)}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
                            slot.filled
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400'
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              slot.filled ? 'bg-slate-300' : 'bg-emerald-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Symptoms or Reason for Visit
                  </label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Follow-up blood glucose check, fatigue, medicine refill request..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back to Doctor Details
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Generate Token</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Booking Confirmation with Token */}
            {step === 4 && confirmedAppt && (
              <div className="p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Appointment Successfully Slotted</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your spot is reserved in the hospital OPD management system.
                  </p>
                </div>

                {/* Token Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-white max-w-sm mx-auto shadow-md">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    OPD Queue Token Number
                  </span>
                  <span className="text-3xl font-black font-mono text-teal-300 tracking-wider block my-1">
                    {confirmedAppt.token_number}
                  </span>
                  <div className="text-xs text-slate-300 pt-2 border-t border-slate-800 flex justify-between">
                    <span>{confirmedAppt.doctor_name}</span>
                    <span>{confirmedAppt.time_slot}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 max-w-sm mx-auto bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">Assigned Reason: </span>
                  {confirmedAppt.assignment_reason === 'chronic-continuity'
                    ? 'Longitudinal continuous care'
                    : confirmedAppt.is_substitute
                    ? 'Substitute physician allocated due to regular doctor leave'
                    : 'Workload load-balanced across available specialists'}
                </div>

                <button
                  onClick={closeBookingModal}
                  className="px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
