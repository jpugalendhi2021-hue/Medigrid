import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FolderPlus,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UploadCloud,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { Doctor, LeaveRequest, Department, Patient, LabReport } from '../types';

// Preset test templates for quick 1-click populating in diagnostic upload
const TEST_TEMPLATES = [
  {
    name: 'Blood Glucose & HbA1c Panel',
    type: 'Biochemistry',
    summary: 'Glycated hemoglobin indicates moderate glycemic control. Fasting plasma glucose corresponds with outpatient targets.',
    params: [
      { name: 'Fasting Blood Sugar (FBS)', value: '118', normal_range: '70 - 100', unit: 'mg/dL', flag: 'high' as const },
      { name: 'Post-Prandial Glucose (PPBS)', value: '152', normal_range: '< 140', unit: 'mg/dL', flag: 'high' as const },
      { name: 'Glycated Hemoglobin (HbA1c)', value: '6.8', normal_range: '< 5.7', unit: '%', flag: 'high' as const },
    ],
  },
  {
    name: 'Complete Blood Count (CBC)',
    type: 'Hematology',
    summary: 'Erythrocyte and platelet parameters within baseline biological references. Normal cellular differential.',
    params: [
      { name: 'Hemoglobin (Hb)', value: '14.2', normal_range: '13.0 - 17.0', unit: 'g/dL', flag: 'normal' as const },
      { name: 'Total Leukocyte Count (WBC)', value: '7,400', normal_range: '4,000 - 11,000', unit: '/µL', flag: 'normal' as const },
      { name: 'Platelet Count', value: '240,000', normal_range: '150,000 - 450,000', unit: '/µL', flag: 'normal' as const },
      { name: 'Packed Cell Volume (PCV)', value: '42.5', normal_range: '40 - 50', unit: '%', flag: 'normal' as const },
    ],
  },
  {
    name: 'Lipid Profile Panel',
    type: 'Biochemistry',
    summary: 'Borderline elevation in low-density lipoprotein. High-density fraction in cardioprotective target.',
    params: [
      { name: 'Total Serum Cholesterol', value: '194', normal_range: '< 200', unit: 'mg/dL', flag: 'normal' as const },
      { name: 'Serum Triglycerides', value: '136', normal_range: '< 150', unit: 'mg/dL', flag: 'normal' as const },
      { name: 'HDL Cholesterol', value: '46', normal_range: '> 40', unit: 'mg/dL', flag: 'normal' as const },
      { name: 'LDL Cholesterol', value: '121', normal_range: '< 100', unit: 'mg/dL', flag: 'high' as const },
    ],
  },
  {
    name: 'Thyroid Function Test (TFT)',
    type: 'Endocrine',
    summary: 'Serum TSH and free thyroid hormones within euthyroid reference margins.',
    params: [
      { name: 'TSH (Ultrasensitive)', value: '2.45', normal_range: '0.4 - 4.2', unit: 'µIU/mL', flag: 'normal' as const },
      { name: 'Free T3', value: '3.1', normal_range: '2.3 - 4.2', unit: 'pg/mL', flag: 'normal' as const },
      { name: 'Free T4', value: '1.24', normal_range: '0.8 - 1.8', unit: 'ng/dL', flag: 'normal' as const },
    ],
  },
  {
    name: 'Kidney Function Test (KFT)',
    type: 'Biochemistry',
    summary: 'Glomerular filtration rate is preserved. Serum creatinine and electrolytes optimal.',
    params: [
      { name: 'Serum Creatinine', value: '0.92', normal_range: '0.7 - 1.3', unit: 'mg/dL', flag: 'normal' as const },
      { name: 'Blood Urea Nitrogen (BUN)', value: '15', normal_range: '7 - 20', unit: 'mg/dL', flag: 'normal' as const },
      { name: 'Serum Uric Acid', value: '5.1', normal_range: '3.5 - 7.2', unit: 'mg/dL', flag: 'normal' as const },
    ],
  },
  {
    name: 'Digital Chest Radiograph (X-Ray PA)',
    type: 'Radiology',
    summary: 'Clear bilateral lung fields without parenchymal consolidation. Cardiothoracic ratio normal.',
    params: [
      { name: 'Lung Fields', value: 'Clear / No Consolidation', normal_range: 'Clear', unit: 'Visual', flag: 'normal' as const },
      { name: 'Cardiothoracic Ratio', value: '< 0.50 Normal', normal_range: '< 0.50', unit: 'Ratio', flag: 'normal' as const },
      { name: 'Bony Thorax', value: 'Intact, no lesions', normal_range: 'Intact', unit: 'Visual', flag: 'normal' as const },
    ],
  },
];

// Department preset templates for quick creation
const DEPARTMENT_PRESETS = [
  { name: 'Cardiology & Heart Care', code: 'CARDIO', icon: 'HeartPulse', wing: 'OPD Block A - Level 1', capacity: 45 },
  { name: 'Endocrinology & Diabetology', code: 'ENDO', icon: 'Activity', wing: 'OPD Block B - Level 2', capacity: 35 },
  { name: 'Neurology & Brain Sciences', code: 'NEURO', icon: 'Brain', wing: 'OPD Block C - Level 3', capacity: 30 },
  { name: 'Orthopedics & Joint Care', code: 'ORTHO', icon: 'Bone', wing: 'OPD Block A - Ground Floor', capacity: 40 },
  { name: 'Pulmonology & Respiratory Medicine', code: 'PULMO', icon: 'Wind', wing: 'OPD Block D - Level 2', capacity: 30 },
  { name: 'Pediatrics & Child Health', code: 'PEDI', icon: 'Users', wing: 'Maternal & Child Wing - Level 1', capacity: 50 },
  { name: 'Dermatology & Cosmetology', code: 'DERM', icon: 'Stethoscope', wing: 'OPD Block B - Level 1', capacity: 35 },
  { name: 'General Surgery & Acute Care', code: 'SURG', icon: 'Shield', wing: 'Surgical OPD Block - Level 2', capacity: 40 },
  { name: 'Ophthalmology & Vision Center', code: 'OPHTH', icon: 'Activity', wing: 'Eye Clinic Annex', capacity: 45 },
  { name: 'ENT & Head-Neck Surgery', code: 'ENT', icon: 'Stethoscope', wing: 'OPD Block C - Level 1', capacity: 35 },
  { name: 'Nephrology & Dialysis Unit', code: 'NEPHRO', icon: 'Activity', wing: 'Renal Care Block - Level 1', capacity: 25 },
  { name: 'Diagnostic Imaging & Radiology', code: 'RADIO', icon: 'Activity', wing: 'Imaging Basement Wing', capacity: 60 },
];

export const HospitalAdminView: React.FC = () => {
  const {
    currentUser,
    hospitals,
    departments,
    doctors,
    appointments,
    leaveRequests,
    patients,
    approveLeaveRequest,
    rejectLeaveRequest,
    toggleDoctorAvailability,
    addDoctor,
    addDepartment,
    uploadLabReport,
    findPatientByPhone,
    recentlyUpdatedApptId,
  } = useData();

  // Active hospital for this admin
  const currentHospital =
    hospitals.find(
      (h) =>
        h.admin_id === currentUser?.id ||
        h.id === currentUser?.hospital_id ||
        h.admin_email?.toLowerCase() === currentUser?.email?.toLowerCase()
    ) || hospitals[0]; // Metro Central Hospital

  const [activeTab, setActiveTab] = useState<'board' | 'leaves' | 'departments'>('board');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive feedback states for leaves
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  // Add Doctor Modal state
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocDeptId, setNewDocDeptId] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocExp, setNewDocExp] = useState(8);
  const [newDocCapacity, setNewDocCapacity] = useState(25);
  const [newDocRoom, setNewDocRoom] = useState('OPD Room 108');

  // Add Department Modal state (Requested: "add department in hospital tab")
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptWing, setDeptWing] = useState('OPD Block B - Level 2');
  const [deptCapacity, setDeptCapacity] = useState(40);
  const [deptIcon, setDeptIcon] = useState('Activity');
  const [deptPhoneExt, setDeptPhoneExt] = useState('2401');

  // Upload Report Through Mobile No. State (Requested: "add upload report through mobile no")
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [matchedPatient, setMatchedPatient] = useState<Patient | null>(null);
  const [isWalkinRegister, setIsWalkinRegister] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinAge, setWalkinAge] = useState(38);
  const [walkinGender, setWalkinGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [reportTitle, setReportTitle] = useState('Complete Blood Count (CBC)');
  const [reportCategory, setReportCategory] = useState('Hematology');
  const [reportDoctor, setReportDoctor] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportSummary, setReportSummary] = useState('Erythrocyte and platelet parameters within baseline biological references.');
  const [reportParameters, setReportParameters] = useState<
    { name: string; value: string; normal_range: string; unit: string; flag: 'normal' | 'high' | 'low' }[]
  >([
    { name: 'Hemoglobin (Hb)', value: '14.2', normal_range: '13.0 - 17.0', unit: 'g/dL', flag: 'normal' },
    { name: 'Total Leukocyte Count (WBC)', value: '7,400', normal_range: '4,000 - 11,000', unit: '/µL', flag: 'normal' },
    { name: 'Platelet Count', value: '240,000', normal_range: '150,000 - 450,000', unit: '/µL', flag: 'normal' },
  ]);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReportSuccess, setUploadedReportSuccess] = useState<LabReport | null>(null);

  // Filter doctors belonging to this hospital
  const hospitalDoctors = useMemo(
    () => doctors.filter((d) => d.hospital_id === currentHospital.id),
    [doctors, currentHospital]
  );

  // Filter departments for this hospital
  const hospitalDepartments = useMemo(
    () => departments.filter((dept) => dept.hospital_id === currentHospital.id),
    [departments, currentHospital]
  );

  // Filter leaves submitted by this hospital's doctors
  const hospitalLeaves = useMemo(() => {
    const docIds = new Set(hospitalDoctors.map((d) => d.id));
    return leaveRequests.filter((l) => docIds.has(l.doctor_id));
  }, [leaveRequests, hospitalDoctors]);

  // Filtered doctors for board
  const filteredDoctors = hospitalDoctors.filter((doc) => {
    const matchesDept = departmentFilter === 'all' || doc.department_id === departmentFilter;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Calculate live statistics - using safe status check
  const totalSlotsToday = hospitalDoctors.reduce((acc, d) => acc + d.avgDailyCapacity, 0);
  const totalBookedToday = hospitalDoctors.reduce((acc, d) => acc + d.todayPatientCount, 0);
  const activeDoctorsCount = hospitalDoctors.filter((d) => d.is_available ?? (d.status !== 'on-leave')).length;
  const onLeaveDoctorsCount = hospitalDoctors.filter((d) => !(d.is_available ?? (d.status !== 'on-leave'))).length;

  // Handle Mobile Number Real-Time Search for Report Upload
  const handleMobileChange = (phoneVal: string) => {
    setMobileInput(phoneVal);
    setUploadedReportSuccess(null);
    const cleaned = phoneVal.trim();
    if (cleaned.length >= 6) {
      const found = findPatientByPhone(cleaned);
      if (found) {
        setMatchedPatient(found);
        setIsWalkinRegister(false);
      } else {
        setMatchedPatient(null);
        setIsWalkinRegister(true);
      }
    } else {
      setMatchedPatient(null);
      setIsWalkinRegister(false);
    }
  };

  // Quick preset template application
  const applyTestPreset = (tmpl: (typeof TEST_TEMPLATES)[0]) => {
    setReportTitle(tmpl.name);
    setReportCategory(tmpl.type);
    setReportSummary(tmpl.summary);
    setReportParameters([...tmpl.params]);
  };

  // Quick department preset application
  const applyDeptPreset = (preset: (typeof DEPARTMENT_PRESETS)[0]) => {
    setDeptName(preset.name);
    setDeptCode(preset.code);
    setDeptWing(preset.wing);
    setDeptCapacity(preset.capacity);
    setDeptIcon(preset.icon);
    if (!deptHead && hospitalDoctors.length > 0) {
      setDeptHead(hospitalDoctors[0].name);
    }
  };

  // Handle Add Doctor Submit
  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocDeptId || !newDocSpecialty.trim()) return;
    const dept = hospitalDepartments.find((d) => d.id === newDocDeptId);
    addDoctor({
      hospital_id: currentHospital.id,
      department_id: newDocDeptId,
      department_name: dept?.name || 'General Medicine',
      name: newDocName.trim(),
      email: newDocEmail.trim() || `dr.${newDocName.toLowerCase().replace(/[^a-z]/g, '')}@medigrid.health`,
      specialization: newDocSpecialty.trim(),
      qualifications: 'MBBS, MD',
      experienceYears: Number(newDocExp),
      avgDailyCapacity: Number(newDocCapacity),
      roomNumber: newDocRoom,
      weekly_schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    });

    setIsAddDoctorOpen(false);
    setNewDocName('');
    setNewDocEmail('');
  };

  // Handle Add Department Submit
  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    addDepartment({
      hospital_id: currentHospital.id,
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      iconName: deptIcon,
      headDoctorName: deptHead.trim() || 'Chief Medical Officer',
      opdWing: deptWing.trim(),
      dailyCapacity: Number(deptCapacity) || 40,
      phoneExtension: deptPhoneExt.trim(),
    });

    setIsAddDepartmentOpen(false);
    setDeptName('');
    setDeptCode('');
    setDeptHead('');
    setActiveTab('departments');
  };

  // Handle File Upload Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: sizeStr,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle Upload Report by Mobile No Submit
  const handleUploadReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileInput.trim() || !reportTitle.trim()) return;

    setIsUploading(true);
    try {
      const docName = reportDoctor.trim() || (hospitalDoctors[0] ? hospitalDoctors[0].name : 'Attending Consultant');
      const newReport = await uploadLabReport({
        mobileNumber: mobileInput.trim(),
        patientName: matchedPatient ? matchedPatient.name : walkinName.trim() || `Patient (${mobileInput.trim()})`,
        patientAge: matchedPatient ? matchedPatient.age : Number(walkinAge) || 35,
        patientGender: matchedPatient ? matchedPatient.gender : walkinGender,
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        title: reportTitle.trim(),
        reportType: reportCategory,
        date: reportDate,
        orderedBy: docName,
        summary: reportSummary.trim(),
        parameters: reportParameters,
        fileName: attachedFile?.name,
        fileData: attachedFile?.dataUrl,
        fileSize: attachedFile?.size,
      });

      setUploadedReportSuccess(newReport);
    } catch (err: any) {
      console.error('Report upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Approve Leave Request with responsive feedback
  const handleApproveLeave = (leaveId: string) => {
    setActionLoadingId(leaveId);
    try {
      const result = approveLeaveRequest(leaveId);
      setActionFeedback({
        id: leaveId,
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        id: leaveId,
        type: 'error',
        message: err?.message || 'Error executing leave approval',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Leave Request with responsive feedback
  const handleRejectLeave = (leaveId: string) => {
    setActionLoadingId(leaveId);
    try {
      const result = rejectLeaveRequest(leaveId);
      setActionFeedback({
        id: leaveId,
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        id: leaveId,
        type: 'error',
        message: err?.message || 'Error executing leave rejection',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Hospital Admin Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{currentHospital.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                ADMIN_CONSOLE
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
              <span className="text-slate-700 font-sans">{currentHospital.district}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-sans">{currentHospital.address}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-sans">
                Admin: <span className="font-semibold text-slate-700">{currentHospital.admin_name || 'Hospital Admin'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls - Prominent Buttons for Mobile Report Upload & Department Management */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsUploadReportOpen(true);
              setUploadedReportSuccess(null);
            }}
            className="px-3.5 py-2 rounded-lg bg-teal-900 hover:bg-teal-800 text-teal-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-teal-800/80 active:scale-[0.98]"
            title="Upload laboratory and diagnostic reports by patient mobile number"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Report (Mobile)</span>
          </button>

          <button
            onClick={() => setIsAddDepartmentOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300/80 shadow-2xs cursor-pointer active:scale-[0.98]"
            title="Add a new clinical department or OPD wing"
          >
            <FolderPlus className="w-3.5 h-3.5 text-teal-700" />
            <span>Add Department</span>
          </button>

          <button
            onClick={() => {
              if (hospitalDepartments.length > 0) {
                setNewDocDeptId(hospitalDepartments[0].id);
              }
              setIsAddDoctorOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Specialist</span>
          </button>
        </div>
      </div>

      {/* Hospital Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hospital Staffing</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 leading-none">
            {activeDoctorsCount} <span className="text-xs font-normal text-slate-500 font-sans">/ {hospitalDoctors.length} Active</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {onLeaveDoctorsCount} currently on leave
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OPD Load Factor</div>
          <div className="text-xl font-bold font-mono text-teal-600 mt-1 leading-none">
            {totalSlotsToday > 0 ? Math.round((totalBookedToday / totalSlotsToday) * 100) : 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {totalBookedToday} booked of {totalSlotsToday} capacity
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Units</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 leading-none">{hospitalDepartments.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">All OPD wings active</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Leaves</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1 leading-none">
            {hospitalLeaves.filter((l) => l.status === 'pending').length}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {hospitalLeaves.filter((l) => l.status === 'escalated_to_dean').length} escalated to Dean
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'board'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Live Availability Board</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-teal-300">
            {hospitalDoctors.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'leaves'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Doctor Leave Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {hospitalLeaves.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Department Load Balancing</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-teal-100 text-teal-800">
            {hospitalDepartments.length} Wings
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE AVAILABILITY BOARD */}
      {activeTab === 'board' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Flight Board */}
          <section className="flex-1 lg:flex-[2.5] w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Live Availability Board</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  CURRENT_LOAD: {totalSlotsToday > 0 ? Math.round((totalBookedToday / totalSlotsToday) * 100) : 0}% • ACTIVE_UNITS: {hospitalDepartments.length}
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full uppercase tracking-widest font-mono">
                  {departmentFilter === 'all' ? 'All Departments' : 'Filtered Unit'}
                </span>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 font-sans outline-hidden text-slate-700"
                >
                  <option value="all">All Departments</option>
                  {hospitalDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Filter doctor / room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 outline-hidden w-40 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* High Density Airport Grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-3 px-5 font-mono">
                <div className="col-span-4">Practitioner / Department</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3">Daily Load Efficiency</div>
                <div className="col-span-2 text-right">Today's Queue</div>
                <div className="col-span-1 text-right">Override</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => {
                  const loadPercent = Math.min(Math.round((doc.todayPatientCount / (doc.avgDailyCapacity || 20)) * 100), 100);
                  const isHighLoad = loadPercent >= 80;
                  const isAvailable = doc.is_available ?? (doc.status !== 'on-leave');

                  return (
                    <div
                      key={doc.id}
                      className={`grid grid-cols-12 px-5 py-3.5 items-center group hover:bg-slate-50/80 transition ${
                        !isAvailable ? 'bg-slate-50/40 opacity-80' : 'bg-white'
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[10px] font-bold text-slate-700 shrink-0">
                          {doc.roomNumber.replace('OPD Room ', 'R-')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase truncate">
                            {doc.department_name} • {doc.specialization}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        {isAvailable ? (
                          doc.todayPatientCount > 0 ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[10px] font-bold uppercase tracking-wide">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                              <span className="text-[10px] font-bold uppercase tracking-wide">Open</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                            <span className="text-[10px] font-bold uppercase tracking-wide">On Leave</span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-3 flex items-center gap-3 px-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHighLoad ? 'bg-amber-500' : loadPercent < 30 ? 'bg-slate-300' : 'bg-teal-500'
                            }`}
                            style={{ width: `${loadPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 w-8 text-right">{loadPercent}%</span>
                      </div>

                      <div className="col-span-2 text-right">
                        <p className="text-base font-mono font-bold leading-none text-slate-900">
                          {doc.todayPatientCount} <span className="text-xs text-slate-400 font-normal">/ {doc.avgDailyCapacity}</span>
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-tighter mt-0.5">Patients assigned</p>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => toggleDoctorAvailability(doc.id)}
                          title={isAvailable ? 'Mark Doctor On Leave' : 'Mark Doctor Available'}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                        >
                          {isAvailable ? (
                            <ToggleRight className="w-5 h-5 text-teal-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* High Density Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-5 shrink-0">
            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between">
                <span>Hospital Actions</span>
                <span className="text-[10px] text-teal-600 font-mono font-bold">FAST_DESK</span>
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsUploadReportOpen(true);
                    setUploadedReportSuccess(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-between border border-teal-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                    Upload Report (Mobile)
                  </span>
                  <span className="text-[10px] bg-teal-200/80 px-1.5 py-0.5 rounded font-mono">NEW</span>
                </button>

                <button
                  onClick={() => setIsAddDepartmentOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center justify-between border border-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
                    Add Clinical Department
                  </span>
                  <Plus className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Priority Escalations Card */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg">
              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1 font-mono">Priority Escalations</p>
              <h3 className="text-lg font-bold leading-tight mb-3">Dean Approval Required</h3>

              {hospitalLeaves.filter((l) => l.is_rule_exceeded || l.status === 'escalated_to_dean').length === 0 ? (
                <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-xs text-white/70">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Queue Clear</span>
                  </div>
                  <p className="text-[11px] text-white/50">No active requests violating continuous leave statute (&gt;2 days).</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitalLeaves
                    .filter((l) => l.is_rule_exceeded || l.status === 'escalated_to_dean')
                    .map((escLeave) => (
                      <div key={escLeave.id} className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500 text-white rounded uppercase font-mono">
                            Continuous Leave
                          </span>
                          <span className="text-[10px] font-mono text-white/50">REQ-{escLeave.id.slice(-3)}</span>
                        </div>
                        <p className="text-xs font-semibold text-white">
                          {escLeave.doctor_name} — {escLeave.consecutive_days} days
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 mb-2.5">Violates: Max 2 consecutive days rule</p>
                        <button
                          onClick={() => setActiveTab('leaves')}
                          className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          View Escalation
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS MANAGEMENT */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Doctor Leave Approvals</h2>
              <p className="text-xs text-slate-500">
                Hospital Admin has unilateral authority for routine leaves (≤2 days). Requests &gt;2 days are strictly escalated to Dean Council.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              {hospitalLeaves.length} Total Applications
            </span>
          </div>

          <div className="space-y-3">
            {hospitalLeaves.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No leave requests filed by doctors of this hospital.
              </div>
            ) : (
              hospitalLeaves.map((leave) => {
                const isRoutine = leave.consecutive_days <= 2;
                return (
                  <div
                    key={leave.id}
                    className={`p-4 rounded-xl border transition ${
                      leave.is_rule_exceeded ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{leave.doctor_name}</span>
                          <span className="text-xs text-slate-500">• {leave.department_name}</span>

                          {leave.is_rule_exceeded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              Exceeds 2-Day Rule ({leave.consecutive_days} Days)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Routine Request ({leave.consecutive_days} Days)
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Duration: </span>
                          <span>
                            {leave.start_date} to {leave.end_date}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-2 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800">Reason: </span>
                          {leave.reason}
                        </p>

                        {/* Inline action feedback toast */}
                        {actionFeedback?.id === leave.id && (
                          <div
                            className={`mt-2 p-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                              actionFeedback.type === 'success'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {actionFeedback.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{actionFeedback.message}</span>
                          </div>
                        )}
                      </div>

                      {/* Approval Controls */}
                      <div className="shrink-0 flex items-center gap-2">
                        {leave.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              disabled={actionLoadingId === leave.id}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoadingId === leave.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{isRoutine ? 'Approve (Admin)' : 'Approve (Dispensation)'}</span>
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              disabled={actionLoadingId === leave.id}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : leave.status === 'escalated_to_dean' ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Shield className="w-3.5 h-3.5 text-amber-700" />
                              Escalated to Dean Council
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <button
                                onClick={() => handleApproveLeave(leave.id)}
                                disabled={actionLoadingId === leave.id}
                                className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Approve under Hospital Executive Authority"
                              >
                                <Check className="w-3 h-3" />
                                <span>Executive Dispensation</span>
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id)}
                                disabled={actionLoadingId === leave.id}
                                className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        ) : leave.status === 'approved' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="text-[10px] text-slate-400 hover:text-emerald-600 underline cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENT LOAD BALANCING & CREATION (Requested: "add department in hospital tab") */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical Departments & OPD Load Balancing</h2>
              <p className="text-xs text-slate-500">
                Manage hospital wings, active specialist allocation, and patient intake distribution.
              </p>
            </div>
            <button
              onClick={() => setIsAddDepartmentOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitalDepartments.map((dept) => {
              const deptDocs = hospitalDoctors.filter((d) => d.department_id === dept.id);
              const deptCapacity = deptDocs.reduce((acc, d) => acc + d.avgDailyCapacity, 0) || dept.dailyCapacity || 30;
              const deptBooked = deptDocs.reduce((acc, d) => acc + d.todayPatientCount, 0);
              const deptPercent = deptCapacity > 0 ? Math.round((deptBooked / deptCapacity) * 100) : 0;

              return (
                <div key={dept.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          {dept.code.slice(0, 3)}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block leading-tight">{dept.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({dept.code})</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {deptDocs.length} Specialists
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 my-2 font-mono">
                      <span>Wing: <span className="text-slate-700 font-sans font-medium">{dept.opdWing || 'OPD Wing A'}</span></span>
                      {dept.phoneExtension && (
                        <>
                          <span>•</span>
                          <span>Ext: <span className="text-slate-700 font-sans">{dept.phoneExtension}</span></span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>OPD Slot Utilization</span>
                        <span className="font-mono font-bold text-slate-900">
                          {deptBooked} / {deptCapacity} ({deptPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            deptPercent > 80 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(deptPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>Head: <span className="font-semibold text-slate-800">{dept.headDoctorName}</span></span>
                    <button
                      onClick={() => {
                        setNewDocDeptId(dept.id);
                        setIsAddDoctorOpen(true);
                      }}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                    >
                      + Add Specialist
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Department Card */}
            <button
              onClick={() => setIsAddDepartmentOpen(true)}
              className="p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 transition flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-400 group-hover:text-teal-700 mb-2 transition">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">Add Clinical Department</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Commission new OPD wing & assign doctor lead</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD DEPARTMENT (Requested: "add department in hospital tab") */}
      {isAddDepartmentOpen && (
        <div
          id="add-dept-modal-backdrop"
          onClick={() => setIsAddDepartmentOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="add-dept-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-default max-h-[90vh] flex flex-col"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Add Department to {currentHospital.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDepartmentOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Quick Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quick Specialty Presets (Click to autofill):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENT_PRESETS.slice(0, 8).map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => applyDeptPreset(preset)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 transition cursor-pointer"
                    >
                      {preset.name.split(' ')[0]} ({preset.code})
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddDepartmentSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="e.g. Pediatrics & Neonatal Care"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Code (Uppercase) *
                    </label>
                    <input
                      type="text"
                      required
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PEDI"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Head of Department / Lead Physician *
                    </label>
                    <input
                      type="text"
                      required
                      value={deptHead}
                      onChange={(e) => setDeptHead(e.target.value)}
                      placeholder="e.g. Dr. Alok Nath"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Wing / Location
                    </label>
                    <input
                      type="text"
                      value={deptWing}
                      onChange={(e) => setDeptWing(e.target.value)}
                      placeholder="e.g. OPD Block B - Level 2"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Slot Capacity
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={deptCapacity}
                      onChange={(e) => setDeptCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Intercom / Phone Extension
                    </label>
                    <input
                      type="text"
                      value={deptPhoneExt}
                      onChange={(e) => setDeptPhoneExt(e.target.value)}
                      placeholder="e.g. Ext 2401"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAddDepartmentOpen(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commission Department</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD REPORT THROUGH MOBILE NO (Requested: "add upload report through mobile no") */}
      {isUploadReportOpen && (
        <div
          id="upload-report-modal-backdrop"
          onClick={() => setIsUploadReportOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="upload-report-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-default max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Diagnostic Report Dispatch</h3>
                  <p className="text-[11px] text-teal-300 font-mono">UPLOAD_BY_MOBILE_NUMBER • {currentHospital.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {uploadedReportSuccess ? (
                /* Success View */
                <div className="p-6 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Diagnostic Report Uploaded Successfully!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Report <span className="font-semibold text-slate-800">{uploadedReportSuccess.title}</span> has been linked to UHID{' '}
                      <span className="font-mono font-bold text-teal-700">{uploadedReportSuccess.patient_id}</span> ({uploadedReportSuccess.patient_name}) and synchronized across MediGrid Cloud.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left max-w-md mx-auto text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient:</span>
                      <span className="font-bold text-slate-800">{uploadedReportSuccess.patient_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono font-semibold text-slate-800">{uploadedReportSuccess.patient_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parameters:</span>
                      <span className="font-semibold text-slate-800">{uploadedReportSuccess.parameters.length} Clinical Biomarkers</span>
                    </div>
                    {uploadedReportSuccess.file_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Attachment:</span>
                        <span className="font-mono text-teal-700">{uploadedReportSuccess.file_name} ({uploadedReportSuccess.file_size})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedReportSuccess(null);
                        setMobileInput('');
                        setMatchedPatient(null);
                        setAttachedFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Upload Another Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadReportOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload Form */
                <form onSubmit={handleUploadReportSubmit} className="space-y-4">
                  {/* Step 1: Mobile Phone Lookup */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Step 1: Patient Mobile Number Lookup *</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">AUTOFIND_ACTIVE</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={mobileInput}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        placeholder="Enter 10-digit mobile (e.g. 9845012345 or +91 98450 12345)"
                        className="w-full pl-9 pr-24 py-2 rounded-lg border border-slate-300 text-xs font-mono outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      {matchedPatient && (
                        <span className="absolute right-2.5 top-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          VERIFIED
                        </span>
                      )}
                    </div>

                    {/* Live Mobile Lookup Result */}
                    {matchedPatient ? (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {matchedPatient.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-emerald-950 block">{matchedPatient.name}</span>
                            <span className="text-[11px] text-emerald-700 font-mono">
                              UHID: {matchedPatient.id} • {matchedPatient.gender}, {matchedPatient.age} Y • {matchedPatient.blood_group}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                          Linked Patient
                        </span>
                      </div>
                    ) : mobileInput.trim().length >= 8 ? (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          <span>No existing patient found with this mobile. Register walk-in patient:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Walk-in Patient Name *"
                            value={walkinName}
                            onChange={(e) => setWalkinName(e.target.value)}
                            className="px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white outline-hidden"
                          />
                          <input
                            type="number"
                            placeholder="Age"
                            value={walkinAge}
                            onChange={(e) => setWalkinAge(Number(e.target.value))}
                            className="px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white outline-hidden"
                          />
                          <select
                            value={walkinGender}
                            onChange={(e) => setWalkinGender(e.target.value as any)}
                            className="px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white outline-hidden"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Step 2: Test Presets & Clinical Report Details */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Step 2: Diagnostic Panel & Templates
                      </label>
                      <span className="text-[10px] text-teal-700 font-semibold">1-Click Auto-Fill</span>
                    </div>

                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {TEST_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => applyTestPreset(tmpl)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                            reportTitle === tmpl.name
                              ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title *</label>
                        <input
                          type="text"
                          required
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                          placeholder="e.g. Complete Hemogram"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Report Category</label>
                        <select
                          value={reportCategory}
                          onChange={(e) => setReportCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden"
                        >
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Endocrine">Endocrine</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Pathology">Pathology</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ordering Specialist</label>
                        <select
                          value={reportDoctor}
                          onChange={(e) => setReportDoctor(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden"
                        >
                          <option value="">Select Specialist (or OPD Desk)</option>
                          {hospitalDoctors.map((doc) => (
                            <option key={doc.id} value={doc.name}>
                              {doc.name} ({doc.department_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Examination</label>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pathologist / Radiologist Impression & Summary
                      </label>
                      <textarea
                        rows={2}
                        value={reportSummary}
                        onChange={(e) => setReportSummary(e.target.value)}
                        placeholder="Clinical summary and diagnostic impression..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Step 3: Test Parameters Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Observed Clinical Biomarkers ({reportParameters.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setReportParameters((prev) => [
                            ...prev,
                            { name: 'New Parameter', value: '0', normal_range: '0 - 10', unit: 'mg/dL', flag: 'normal' },
                          ])
                        }
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Parameter</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                      <div className="grid grid-cols-12 bg-slate-100 p-2 text-[10px] font-bold uppercase text-slate-500 font-mono">
                        <div className="col-span-4">Parameter</div>
                        <div className="col-span-2">Value</div>
                        <div className="col-span-2">Unit</div>
                        <div className="col-span-2">Ref Range</div>
                        <div className="col-span-2 text-right">Flag / Action</div>
                      </div>

                      {reportParameters.map((param, idx) => (
                        <div key={idx} className="grid grid-cols-12 p-2 items-center gap-1.5 text-xs">
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReportParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, name: val } : p)));
                            }}
                            className="col-span-4 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReportParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, value: val } : p)));
                            }}
                            className="col-span-2 px-2 py-1 border border-slate-200 rounded text-xs font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={param.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReportParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, unit: val } : p)));
                            }}
                            className="col-span-2 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={param.normal_range}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReportParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, normal_range: val } : p)));
                            }}
                            className="col-span-2 px-2 py-1 border border-slate-200 rounded text-xs text-slate-500"
                          />
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <select
                              value={param.flag}
                              onChange={(e) => {
                                const val = e.target.value as 'normal' | 'high' | 'low';
                                setReportParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, flag: val } : p)));
                              }}
                              className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border ${
                                param.flag === 'high'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : param.flag === 'low'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="low">Low</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setReportParameters((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete parameter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: File Document Attachment */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                      <span>Step 3: Attach Digital Document / Scan (PDF, Image)</span>
                    </label>

                    <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-teal-50/20 transition relative">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,.txt"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {attachedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <Paperclip className="w-5 h-5 text-teal-600" />
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-900 block">{attachedFile.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{attachedFile.size} • Verified</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachedFile(null);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-700">Click or Drag & Drop patient scan / report file</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG, DICOM preview</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsUploadReportOpen(false)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !mobileInput.trim()}
                      className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading & Indexing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Upload & Bind to Patient UHID</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD SPECIALIST DOCTOR */}
      {isAddDoctorOpen && (
        <div
          id="add-doctor-modal-backdrop"
          onClick={() => setIsAddDoctorOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="add-doctor-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Add Doctor to Hospital Roster</h3>
              </div>
              <button
                type="button"
                id="close-add-doctor-modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddDoctorOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Dr. Anand Verma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newDocDeptId}
                    onChange={(e) => setNewDocDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-hidden"
                  >
                    {hospitalDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    placeholder="e.g. Clinical Cardiologist"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Capacity</label>
                  <input
                    type="number"
                    value={newDocCapacity}
                    onChange={(e) => setNewDocCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newDocRoom}
                    onChange={(e) => setNewDocRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Specialist to OPD</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
