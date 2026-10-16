import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { Hospital, LeaveRequest } from '../types';

export const SuperAdminView: React.FC = () => {
  const {
    currentUser,
    hospitals,
    doctors,
    appointments,
    leaveRequests,
    auditLogs,
    deanApproveLeave,
    deanRejectLeave,
    addHospital,
  } = useData();

  const [activeTab, setActiveTab] = useState<'escalations' | 'hospitals' | 'audits'>('escalations');
  const [isAddHospOpen, setIsAddHospOpen] = useState(false);

  // New Hospital form state
  const [hospName, setHospName] = useState('');
  const [hospDistrict, setHospDistrict] = useState('East Health Corridor');
  const [hospAddress, setHospAddress] = useState('');
  const [hospContact, setHospContact] = useState('+91 22 4900 1200');
  const [hospAdminName, setHospAdminName] = useState('');
  const [hospAdminEmail, setHospAdminEmail] = useState('');

  // Escalated leaves (>2 days)
  const escalatedLeaves = useMemo(
    () => leaveRequests.filter((l) => l.is_rule_exceeded || l.status === 'escalated_to_dean'),
    [leaveRequests]
  );

  const pendingEscalations = escalatedLeaves.filter((l) => l.status === 'escalated_to_dean');
  const resolvedEscalations = escalatedLeaves.filter((l) => l.status !== 'escalated_to_dean');

  // Network stats
  const totalDoctors = doctors.length;
  const totalHospitals = hospitals.length;
  const totalAppointments = appointments.length;
  const activeDoctors = doctors.filter((d) => d.is_available).length;
  const networkUtilization = Math.round(
    (doctors.reduce((acc, d) => acc + d.todayPatientCount, 0) /
      doctors.reduce((acc, d) => acc + d.avgDailyCapacity, 0)) *
      100
  );

  const handleAddHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospName || !hospAdminName) {
      alert('Please fill out hospital name and administrator name.');
      return;
    }
    addHospital({
      name: hospName,
      district: hospDistrict,
      address: hospAddress || `${hospDistrict} Medical Campus`,
      contact: hospContact,
      status: 'active',
      admin_name: hospAdminName,
      admin_email: hospAdminEmail || `admin.${hospName.toLowerCase().replace(/[^a-z]/g, '')}@medigrid.health`,
    });
    setIsAddHospOpen(false);
    setHospName('');
    setHospAdminName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Super Admin Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black shadow-xs shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Dean Council Governance Board</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                SUPER_ADMIN_COUNCIL
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
              <span className="font-sans">Chair: <span className="font-semibold text-slate-800">{currentUser?.name || 'Dr. Arthur Vance'}</span></span>
              <span className="text-slate-300">•</span>
              <span className="font-sans">Regional Network Oversight</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold font-sans">Continuous Care Enforced</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddHospOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Charter New Hospital</span>
          </button>
        </div>
      </div>

      {/* High Density Network Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hospitals in Network</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 leading-none">{totalHospitals}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 3 medical districts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Credentialed Doctors</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 leading-none">
            {activeDoctors} <span className="text-xs font-normal text-slate-500 font-sans">/ {totalDoctors} On Duty</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {totalDoctors - activeDoctors} on approved leave
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Network Utilization</div>
          <div className="text-xl font-bold font-mono text-teal-600 mt-1 leading-none">{networkUtilization}%</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">{totalAppointments} TOTAL OPD SLOTS</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dean Escalation Queue</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1 leading-none">{pendingEscalations.length}</div>
          <div className="text-[10px] text-amber-800 font-semibold mt-1">
            Requires Council Review
          </div>
        </div>
      </div>

      {/* High Density Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Priority Leave Escalation Inbox</span>
          {pendingEscalations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] font-mono">
              {pendingEscalations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'hospitals'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Hospital Network Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {hospitals.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audits'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Governance Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DEAN ESCALATION INBOX */}
      {activeTab === 'escalations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>Continuous Leave Rule Escalations (&gt;2 Consecutive Days)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  By clinical statute, hospital administrators cannot approve leaves longer than 2 consecutive days. These require Dean Council dispensation.
                </p>
              </div>
            </div>

            {pendingEscalations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-800">All Escalated Leave Inboxes Cleared</div>
                <p className="text-xs text-slate-500 mt-1">
                  No continuous leave applications currently awaiting Dean Council resolution.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEscalations.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-5 rounded-xl border-2 border-amber-300 bg-amber-50/40 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{leave.doctor_name}</span>
                          <span className="text-xs text-slate-500">• {leave.department_name}</span>
                          <span className="text-xs font-semibold text-slate-700">({leave.hospital_name})</span>
                        </div>

                        {/* Statutory rule explanation */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>
                            Automated Violation: {leave.consecutive_days} consecutive days requested ({leave.start_date} to {leave.end_date})
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 mt-2.5 bg-white p-3 rounded-lg border border-amber-200">
                          <span className="font-semibold text-slate-800">Physician's Stated Justification: </span>
                          <p className="italic text-slate-700 mt-0.5">"{leave.reason}"</p>
                        </div>
                      </div>

                      {/* Dean Decisions */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => deanApproveLeave(leave.id)}
                          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Dean Council Dispensation (Approve)</span>
                        </button>
                        <button
                          onClick={() => deanRejectLeave(leave.id)}
                          className="px-4 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject & Retain in OPD</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Dean Decisions */}
          {resolvedEscalations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Past Dean Council Rulings</h3>
              <div className="space-y-2">
                {resolvedEscalations.map((l) => (
                  <div key={l.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{l.doctor_name}</span>
                      <span className="text-slate-500 ml-2">({l.consecutive_days} days: {l.start_date} → {l.end_date})</span>
                      <p className="text-[11px] text-slate-600 mt-0.5 italic">"{l.reason}"</p>
                    </div>
                    <div className="text-right">
                      {l.status === 'approved' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dean Approved
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Dean Rejected
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">{l.reviewed_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOSPITAL NETWORK DIRECTORY */}
      {activeTab === 'hospitals' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Regional Health System Facilities</h2>
            <p className="text-xs text-slate-500">Integrated hospitals sharing unified OPD load balancing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hospitals.map((hosp) => {
              const hospDocs = doctors.filter((d) => d.hospital_id === hosp.id);
              const hospAppts = appointments.filter((a) => a.hospital_id === hosp.id);

              return (
                <div key={hosp.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {hosp.district}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {hosp.address}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Staff Doctors</span>
                        <span className="font-bold text-slate-900">{hospDocs.length} Specialists</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Slotted Visits</span>
                        <span className="font-bold text-teal-700">{hospAppts.length} Patients</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>Admin: {hosp.admin_name}</span>
                    <span className="font-mono text-[11px] text-slate-400">{hosp.contact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Governance & Clinical Allocation Audit Logs</h2>
              <p className="text-xs text-slate-500">
                Immutable record of OPD assignments, leave approvals, and clinical actions
              </p>
            </div>
            <button
              onClick={() => alert('Exporting signed audit ledger to CSV / PDF format.')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2 px-4 text-teal-700 font-medium whitespace-nowrap">
                      {log.performedBy}
                    </td>
                    <td className="py-2 px-4 text-slate-600 font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CHARTER NEW HOSPITAL */}
      {isAddHospOpen && (
        <div
          id="charter-hospital-modal-backdrop"
          onClick={() => setIsAddHospOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            id="charter-hospital-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Charter New Hospital to Network</h3>
              </div>
              <button
                type="button"
                id="close-charter-modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddHospOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleAddHospitalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. Apollo Super Specialty Hospital"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District Corridor *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospDistrict}
                    onChange={(e) => setHospDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={hospContact}
                    onChange={(e) => setHospContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Campus Address
                </label>
                <input
                  type="text"
                  value={hospAddress}
                  onChange={(e) => setHospAddress(e.target.value)}
                  placeholder="e.g. Sector 14, Institutional Area, New Delhi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Administrator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospAdminName}
                    onChange={(e) => setHospAdminName(e.target.value)}
                    placeholder="e.g. Col. Rohit Sharma"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    value={hospAdminEmail}
                    onChange={(e) => setHospAdminEmail(e.target.value)}
                    placeholder="admin@medigrid.health"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddHospOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Provision Hospital to MediGrid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
