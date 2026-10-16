import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  HeartHandshake,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Stethoscope,
  User as UserIcon,
  UserPlus,
  X,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { Role } from '../types';
import { INITIAL_USERS } from '../mockData';
import { MediGridLogo } from './MediGridLogo';

export const UnifiedLogin: React.FC = () => {
  const {
    login,
    registerPatient,
    currentRole,
    allUsers,
    signInWithGoogleAuth,
    signInWithEmailAuth,
    registerWithEmailAuth,
    resetPasswordAuth,
    isAuthLoading,
  } = useData();

  // Role selector defaults to remembered role
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole || 'patient');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>(() => {
    const initial = allUsers.find((u) => u.role === (currentRole || 'patient')) || INITIAL_USERS[0];
    return initial ? initial.email : '';
  });
  const [password, setPassword] = useState('demo123');
  
  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  
  // Registration form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+91 ');
  const [regAge, setRegAge] = useState(35);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regBlood, setRegBlood] = useState('B+ Positive');
  const [regEmergency, setRegEmergency] = useState('');
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHypertension, setHasHypertension] = useState(false);

  // Pre-fill email when role changes
  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setAuthError(null);
    const usersForRole = allUsers.filter((u) => u.role === role);
    if (usersForRole.length > 0) {
      setEmail(usersForRole[0].email);
    } else {
      setEmail('');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogleAuth(selectedRole);
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAuth(email, password, selectedRole);
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) {
      alert('Please fill out your name and email.');
      return;
    }
    const chronic: string[] = [];
    if (hasDiabetes) chronic.push('Type 2 Diabetes Mellitus');
    if (hasHypertension) chronic.push('Essential Hypertension');

    setAuthError(null);
    try {
      await registerWithEmailAuth({
        email: regEmail,
        pass: 'Medigrid@2026',
        name: regName,
        role: 'patient',
        phone: regPhone,
        age: Number(regAge),
        gender: regGender,
        blood_group: regBlood,
        chronic_conditions: chronic,
        emergency_contact: regEmergency || 'Family member',
      });
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    }
  };

  // Visual theming based on selected role
  const roleThemeConfig = {
    patient: {
      accentColor: 'border-emerald-500 text-emerald-700 bg-emerald-50/50',
      heroGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      roleBadge: 'bg-emerald-100 text-emerald-800',
      icon: HeartHandshake,
      title: 'Patient Portal',
      subtitle: 'Schedule consultations, trace digital health history, and maintain doctor continuity.',
    },
    doctor: {
      accentColor: 'border-cyan-500 text-cyan-700 bg-cyan-50/50',
      heroGradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
      roleBadge: 'bg-cyan-100 text-cyan-800',
      icon: Stethoscope,
      title: 'Doctor OPD Console',
      subtitle: 'Real-time patient queue, instant checkup entry with delta calculations, and leave scheduling.',
    },
    hospital_admin: {
      accentColor: 'border-blue-500 text-blue-700 bg-blue-50/50',
      heroGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      roleBadge: 'bg-blue-100 text-blue-800',
      icon: Building2,
      title: 'Hospital Management',
      subtitle: 'Airport-style live doctor availability board, leave approvals, and department load balancing.',
    },
    super_admin: {
      accentColor: 'border-amber-500 text-amber-700 bg-amber-50/50',
      heroGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      roleBadge: 'bg-amber-100 text-amber-800',
      icon: Shield,
      title: 'Super Admin / Dean Council',
      subtitle: 'Cross-hospital network governance, priority leave escalation inbox, and regional hospital health metrics.',
    },
  }[selectedRole];

  const CurrentIcon = roleThemeConfig.icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Side: Dynamic Illustration & Role Showcase */}
        <div
          className={`w-full md:w-5/12 p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${roleThemeConfig.heroGradient} border-b md:border-b-0 md:border-r border-slate-200`}
        >
          {/* Subtle background pulse graphic */}
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-6">
              <MediGridLogo size="md" />
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                Medi<span className="text-teal-600">Grid</span>
              </span>
            </div>

            {/* Dynamic Role Showcase */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white border border-slate-200 shadow-2xs">
                <CurrentIcon className="w-4 h-4 text-teal-600" />
                <span className="text-slate-700">{roleThemeConfig.title}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                One Unified Gateway to Multi-Hospital Care
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {roleThemeConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Real-Time System Telemetry & Clinical Network Capabilities */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Real-Time Clinical Telemetry</span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE RT
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/85 border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <Activity className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Dynamic OPD Load Balancing</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Real-time queue redistribution matching doctors and wait times across facilities.
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/85 border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Inter-Hospital Emergency Relay</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Live patient triage and automated cross-facility specialist referrals.
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/85 border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Digital Health Record Vault</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    End-to-end encrypted consultations ensuring chronic doctor continuity.
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsed quick credentials reference for testing */}
            <details className="mt-2 text-[11px] text-slate-500 group">
              <summary className="cursor-pointer font-medium hover:text-slate-700 flex items-center gap-1 select-none text-[10px]">
                <span>View Standard Gateway Credentials</span>
              </summary>
              <div className="mt-2 p-2.5 rounded-lg bg-white/90 border border-slate-200 text-[10px] space-y-1.5 font-mono text-slate-600 shadow-2xs">
                <div
                  className="cursor-pointer hover:text-teal-700 flex justify-between"
                  onClick={() => { setSelectedRole('patient'); setEmail('arjun.sharma@example.com'); }}
                >
                  <span className="font-bold">Patient:</span> <span>arjun.sharma@example.com</span>
                </div>
                <div
                  className="cursor-pointer hover:text-teal-700 flex justify-between"
                  onClick={() => { setSelectedRole('doctor'); setEmail('dr.priyarao@medigrid.health'); }}
                >
                  <span className="font-bold">Doctor:</span> <span>dr.priyarao@medigrid.health</span>
                </div>
                <div
                  className="cursor-pointer hover:text-teal-700 flex justify-between"
                  onClick={() => { setSelectedRole('hospital_admin'); setEmail('admin.metro@medigrid.health'); }}
                >
                  <span className="font-bold">Admin:</span> <span>admin.metro@medigrid.health</span>
                </div>
                <div
                  className="cursor-pointer hover:text-teal-700 flex justify-between"
                  onClick={() => { setSelectedRole('super_admin'); setEmail('dean.council@medigrid.health'); }}
                >
                  <span className="font-bold">Dean:</span> <span>dean.council@medigrid.health</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Right Side: Segmented Role Control & Form */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between">
          <div>
            {/* Top Segmented Control */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 text-xs">
                {(['patient', 'doctor', 'hospital_admin', 'super_admin'] as Role[]).map((r) => {
                  const isSelected = selectedRole === r;
                  const label =
                    r === 'patient'
                      ? 'Patient'
                      : r === 'doctor'
                      ? 'Doctor'
                      : r === 'hospital_admin'
                      ? 'Hospital'
                      : 'Dean';
                  return (
                    <button
                      key={r}
                      type="button"
                      id={`role-btn-${r}`}
                      onClick={() => handleRoleChange(r)}
                      className={`py-2 px-1 text-center font-semibold rounded-lg transition cursor-pointer select-none active:scale-[0.98] ${
                        isSelected
                          ? 'bg-white text-teal-950 shadow-xs ring-1 ring-slate-900/10 font-bold'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Between Sign In & Self Register (Only for Patients) */}
            {selectedRole === 'patient' && (
              <div className="flex items-center gap-4 mb-5 border-b border-slate-100 pb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className={`pb-1 transition ${
                    !isRegistering
                      ? 'text-teal-700 border-b-2 border-teal-600 font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className={`pb-1 flex items-center gap-1.5 transition ${
                    isRegistering
                      ? 'text-teal-700 border-b-2 border-teal-600 font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register as Patient</span>
                </button>
              </div>
            )}

            {/* If Not Patient: Informative notice about governance account provisioning */}
            {selectedRole !== 'patient' && (
              <div className="mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Administrative Governance: </span>
                  {selectedRole === 'doctor'
                    ? 'Doctor credentials are provisioned by your respective Hospital Administration.'
                    : selectedRole === 'hospital_admin'
                    ? 'Hospital Administrator credentials are authenticated and provisioned by the Dean Council.'
                    : 'Dean Council accounts are restricted to verified regional health authority executives.'}
                </div>
              </div>
            )}

            {/* Forms */}
            {!isRegistering || selectedRole !== 'patient' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Real-Time Security Verification Header */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                      <Shield className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>Real-Time Healthcare Gateway</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        256-Bit SSL Encrypted • Live Multi-Hospital Interconnect
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    SECURE RT
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Healthcare ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRole === 'patient'
                          ? 'e.g., arjun.sharma@example.com or your registered email'
                          : selectedRole === 'doctor'
                          ? 'e.g., dr.priyarao@medigrid.health or staff ID'
                          : selectedRole === 'hospital_admin'
                          ? 'e.g., admin.metro@medigrid.health'
                          : 'dean.council@medigrid.health'
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-sans"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setForgotEmail(email || (selectedRole === 'patient' ? 'arjun.sharma@example.com' : 'dr.priyarao@medigrid.health'));
                        setForgotSent(false);
                        setShowForgotModal(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setForgotEmail(email || (selectedRole === 'patient' ? 'arjun.sharma@example.com' : 'dr.priyarao@medigrid.health'));
                          setForgotSent(false);
                          setShowForgotModal(true);
                        }
                      }}
                      title="Recover your password or credentials"
                      className="text-[11px] text-teal-600 hover:text-teal-700 hover:underline cursor-pointer font-medium select-none"
                    >
                      Forgot?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="sign-in-submit-btn"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none disabled:opacity-60"
                >
                  <span>{isAuthLoading ? 'Authenticating...' : `Sign In to ${roleThemeConfig.title}`}</span>
                  <ArrowRight className="w-4 h-4 pointer-events-none" />
                </button>
              </form>
            ) : (
              /* Patient Self-Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ramesh@example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={regAge}
                      onChange={(e) => setRegAge(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Gender
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Blood Group
                    </label>
                    <select
                      value={regBlood}
                      onChange={(e) => setRegBlood(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden bg-white"
                    >
                      <option value="A+ Positive">A+</option>
                      <option value="A- Negative">A-</option>
                      <option value="B+ Positive">B+</option>
                      <option value="B- Negative">B-</option>
                      <option value="O+ Positive">O+</option>
                      <option value="O- Negative">O-</option>
                      <option value="AB+ Positive">AB+</option>
                      <option value="AB- Negative">AB-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100">
                  <div className="text-[11px] font-bold text-teal-900 mb-1">
                    Continuous Care Setup (Optional)
                  </div>
                  <div className="flex gap-4 text-xs text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasDiabetes}
                        onChange={(e) => setHasDiabetes(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-0"
                      />
                      <span>Diabetes Mellitus</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHypertension}
                        onChange={(e) => setHasHypertension(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-0"
                      />
                      <span>Hypertension</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAuthLoading ? 'Registering...' : 'Create Patient Account & Sign In'}</span>
                </button>
              </form>
            )}

            {/* Auth Error Message if any */}
            {authError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold shrink-0">Notice:</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Firebase Google Auth Divider and Action */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                <span className="bg-white px-2.5 text-slate-400">Or authenticate with Firebase</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-60 active:bg-slate-100"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>
                {isAuthLoading
                  ? 'Connecting to Google...'
                  : `Sign In with Google (${roleThemeConfig.title.split(' ')[0]})`}
              </span>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>MediGrid Health System v2.4</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>TLS / HIPAA Compliant Gateway</span>
            </span>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500">MediGrid Multi-Hospital Credential Recovery</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Recovery Instructions Dispatched!</span>
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    A single-use password reset link and temporary verification code have been routed to{' '}
                    <strong className="font-mono text-emerald-950">{forgotEmail}</strong>.
                  </p>
                  <div className="mt-2 text-[10px] font-mono bg-white/80 p-2 rounded border border-emerald-200 text-emerald-800 flex items-center justify-between">
                    <span>AUTH_TOKEN: RST-892401-MG</span>
                    <span className="text-emerald-600 font-bold">15m VALID</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1">Demo Quick Access:</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    In this demonstration environment, default sample accounts accept password <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">demo123</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPassword('demo123');
                    if (forgotEmail) setEmail(forgotEmail);
                    setShowForgotModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Auto-fill Demo Password & Sign In</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotEmail) return;
                  resetPasswordAuth(forgotEmail);
                  setForgotSent(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Healthcare Email / ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. arjun.sharma@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-sans"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the email registered with your hospital or clinical department.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-0.5">Quick Demo Tip</div>
                  <p className="text-[11px] text-slate-500">
                    You can dispatch a simulated recovery token or use the pre-seeded credentials for instant access.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Reset Token</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
