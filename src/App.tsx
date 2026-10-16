import React, { useState } from 'react';
import { DataProvider, useData } from './store/DataContext';
import { Navbar } from './components/Navbar';
import { UnifiedLogin } from './components/UnifiedLogin';
import { PatientView } from './components/PatientView';
import { DoctorView } from './components/DoctorView';
import { HospitalAdminView } from './components/HospitalAdminView';
import { SuperAdminView } from './components/SuperAdminView';
import { JavaSpecModal } from './components/JavaSpecModal';

const MediGridApp: React.FC = () => {
  const { currentUser, currentRole } = useData();
  const [isJavaSpecOpen, setIsJavaSpecOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation */}
      <Navbar onOpenJavaSpec={() => setIsJavaSpecOpen(true)} />

      {/* Main Role-Based View */}
      <main className="flex-1">
        {!currentUser ? (
          <UnifiedLogin />
        ) : currentRole === 'patient' ? (
          <PatientView />
        ) : currentRole === 'doctor' ? (
          <DoctorView />
        ) : currentRole === 'hospital_admin' ? (
          <HospitalAdminView />
        ) : (
          <SuperAdminView />
        )}
      </main>

      {/* Java Architecture & College Viva Specification Modal */}
      <JavaSpecModal isOpen={isJavaSpecOpen} onClose={() => setIsJavaSpecOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <MediGridApp />
    </DataProvider>
  );
}
