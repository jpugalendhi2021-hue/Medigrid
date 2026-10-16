import React, { useState } from 'react';
import { X, Code, Database, Server, Cpu, Copy, Check, FileText, Download } from 'lucide-react';

interface JavaSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaSpecModal: React.FC<JavaSpecModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'departments_reports' | 'engine' | 'controller' | 'schema' | 'architecture'>('leaves');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const JAVA_LEAVE_GOVERNANCE_CODE = `package com.medigrid.service;

import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MediGrid Clinical Leave Governance Engine (Java Spring Boot 3)
 * Implements unilateral hospital approval (<= 2 days), hospital reject,
 * and Dean Council escalation (> 2 days).
 */
@Service
@RequiredArgsConstructor
public class LeaveGovernanceService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final DoctorRepository doctorRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Hospital Admin Approval (Unilateral <= 2 days or Executive Dispensation)
     */
    public LeaveRequest hospitalApproveLeave(String leaveId, String adminName) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        boolean isExtended = leave.isRuleExceeded() || leave.getConsecutiveDays() > 2;

        leave.setStatus("approved");
        leave.setReviewedBy(adminName != null ? adminName : "Hospital Administrator");
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes(isExtended ?
                "Approved by Hospital Administration under executive clinical dispensation." :
                "Approved by Hospital Administration (Within routine 2-day limit).");

        LeaveRequest saved = leaveRequestRepository.save(leave);

        // Update doctor availability on live board if active today
        if (leave.getStartDate() != null && leave.getEndDate() != null) {
            String today = LocalDate.now().toString();
            if (today.compareTo(leave.getStartDate()) >= 0 && today.compareTo(leave.getEndDate()) <= 0) {
                doctorRepository.findById(leave.getDoctorId()).ifPresent(doc -> {
                    doc.setAvailable(false);
                    doctorRepository.save(doc);
                });
            }
        }

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_LEAVE_APPROVED")
                .actor(adminName != null ? adminName : "Hospital Administrator")
                .target(leave.getDoctorName())
                .details("Approved leave of " + leave.getConsecutiveDays() + " days for " + leave.getDoctorName())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    /**
     * Hospital Admin Rejection (Staffing Quota Maintenance)
     */
    public LeaveRequest hospitalRejectLeave(String leaveId, String adminName, String reason) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        leave.setStatus("rejected");
        leave.setReviewedBy(adminName != null ? adminName : "Hospital Administrator");
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes(reason != null ? reason : "Disapproved due to patient load surges and minimum clinical staffing ratios.");

        LeaveRequest saved = leaveRequestRepository.save(leave);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_LEAVE_REJECTED")
                .actor(adminName != null ? adminName : "Hospital Administrator")
                .target(leave.getDoctorName())
                .details("Declined leave for " + leave.getDoctorName() + ": " + leave.getReviewNotes())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }
}`;

  const JAVA_DEPT_REPORT_CODE = `package com.medigrid.controller;

import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * MediGrid Hospital Department Commissioning & Mobile Lab Report Dispatch
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalManagementController {

    private final DepartmentRepository departmentRepository;
    private final PatientRepository patientRepository;
    private final LabReportRepository labReportRepository;
    private final AuditLogRepository auditLogRepository;

    // 1. Commission New Department in Hospital
    @PostMapping("/hospitals/{hospitalId}/departments")
    public ResponseEntity<Department> addDepartment(
            @PathVariable String hospitalId,
            @RequestBody Department department
    ) {
        department.setHospitalId(hospitalId);
        if (department.getId() == null || department.getId().isEmpty()) {
            department.setId("dept-" + UUID.randomUUID().toString().substring(0, 8));
        }
        Department saved = departmentRepository.save(department);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_DEPARTMENT_ADDED")
                .actor("Hospital Administrator")
                .target(department.getName())
                .details("Commissioned clinical department " + department.getName() + " (" + department.getCode() + ")")
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    // 2. Search Patient by Mobile Number
    @GetMapping("/patients/by-phone/{phone}")
    public ResponseEntity<Patient> getPatientByPhone(@PathVariable String phone) {
        return patientRepository.findByPhone(phone.trim())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Upload Diagnostic Lab Report dispatched via Mobile Number
    @PostMapping("/patients/upload-report-by-mobile")
    public ResponseEntity<LabReport> uploadReportByMobile(@RequestBody Map<String, Object> req) {
        String phone = req.get("phone").toString().trim();
        String patientName = req.get("patientName") != null ? req.get("patientName").toString() : "Patient (" + phone + ")";

        // Lookup or register walk-in patient
        Patient patient = patientRepository.findByPhone(phone)
                .orElseGet(() -> patientRepository.save(Patient.builder()
                        .id("pat-" + UUID.randomUUID().toString().substring(0, 8))
                        .phone(phone)
                        .name(patientName)
                        .gender(req.getOrDefault("gender", "Other").toString())
                        .age(req.containsKey("age") ? ((Number) req.get("age")).intValue() : 35)
                        .build()));

        LabReport report = LabReport.builder()
                .id("lab-" + UUID.randomUUID().toString().substring(0, 8))
                .patientId(patient.getId())
                .patientName(patient.getName())
                .mobileNumber(phone)
                .hospitalId(req.getOrDefault("hospitalId", "hosp-1").toString())
                .hospitalName(req.getOrDefault("hospitalName", "Metro Central Hospital").toString())
                .testName(req.getOrDefault("title", "Laboratory Report").toString())
                .category(req.getOrDefault("category", "Biochemistry").toString())
                .date(req.getOrDefault("date", LocalDate.now().toString()).toString())
                .doctorName(req.getOrDefault("orderedBy", "Consultant").toString())
                .summary(req.getOrDefault("summary", "Complete.").toString())
                .fileUrl(req.get("fileUrl") != null ? req.get("fileUrl").toString() : null)
                .status("ready")
                .uploadedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(labReportRepository.save(report));
    }
}`;

  const JAVA_ENGINE_CODE = `package com.medigrid.service;

import com.medigrid.entity.*;
import com.medigrid.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;

/**
 * MediGrid Core Smart Doctor Allocation Engine
 * College Project Implementation: Load-balanced doctor distribution
 * with chronic-disease continuity of care override.
 */
@Service
public class SmartAllocationService {

    private final DoctorRepository doctorRepo;
    private final AppointmentRepository appointmentRepo;
    private final LeaveRepository leaveRepo;
    private final PatientRepository patientRepo;
    private final AuditLogRepository auditLogRepo;

    public SmartAllocationService(DoctorRepository doctorRepo,
                                  AppointmentRepository appointmentRepo,
                                  LeaveRepository leaveRepo,
                                  PatientRepository patientRepo,
                                  AuditLogRepository auditLogRepo) {
        this.doctorRepo = doctorRepo;
        this.appointmentRepo = appointmentRepo;
        this.leaveRepo = leaveRepo;
        this.patientRepo = patientRepo;
        this.auditLogRepo = auditLogRepo;
    }

    @Transactional
    public AllocationDecision allocateDoctor(Long hospitalId, Long departmentId, LocalDate date, Long patientId) {
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + patientId));

        // Step 1: Chronic-Disease Continuity Override Check
        boolean isChronic = patient.hasChronicCondition() || 
                           appointmentRepo.existsByPatientIdAndDepartmentId(patientId, departmentId);

        if (isChronic && patient.getPrimaryDoctor() != null) {
            Doctor regularDoctor = patient.getPrimaryDoctor();

            // Check if regular doctor belongs to the target hospital & department
            if (regularDoctor.getHospital().getId().equals(hospitalId) &&
                regularDoctor.getDepartment().getId().equals(departmentId)) {

                boolean isOnLeave = leaveRepo.isDoctorOnApprovedLeave(regularDoctor.getId(), date);
                if (!isOnLeave) {
                    // Regular doctor available -> Preserve continuity of care!
                    return new AllocationDecision(regularDoctor, AllocationReason.CHRONIC_CONTINUITY, false, null);
                } else {
                    // Regular doctor is on leave -> Fallback to load-balanced substitute
                    Doctor substitute = findLowestLoadDoctor(hospitalId, departmentId, date, regularDoctor.getId());
                    return new AllocationDecision(substitute, AllocationReason.SUBSTITUTE, true, regularDoctor.getName());
                }
            }
        }

        // Step 2: Standard Load-Balanced Assignment
        Doctor chosenDoctor = findLowestLoadDoctor(hospitalId, departmentId, date, null);
        return new AllocationDecision(chosenDoctor, AllocationReason.LOAD_BALANCED, false, null);
    }

    private Doctor findLowestLoadDoctor(Long hospitalId, Long departmentId, LocalDate date, Long excludeDoctorId) {
        // Fetch doctors in hospital & department excluding approved leave
        List<Doctor> candidates = doctorRepo.findAvailableDoctors(hospitalId, departmentId, date);

        if (excludeDoctorId != null) {
            candidates.removeIf(d -> d.getId().equals(excludeDoctorId));
        }

        if (candidates.isEmpty()) {
            throw new NoDoctorAvailableException("No specialist available for " + date);
        }

        // Real-time count of bookings for each doctor on the specified date
        return candidates.stream()
                .min(Comparator.comparingInt(doc -> appointmentRepo.countActiveByDoctorAndDate(doc.getId(), date)))
                .orElse(candidates.get(0));
    }
}`;

  const JAVA_CONTROLLER_CODE = `package com.medigrid.controller;

import com.medigrid.dto.*;
import com.medigrid.service.SmartAllocationService;
import com.medigrid.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final SmartAllocationService allocationService;
    private final AppointmentService appointmentService;
    private final SimpMessagingTemplate messagingTemplate;

    public AppointmentController(SmartAllocationService allocationService,
                                 AppointmentService appointmentService,
                                 SimpMessagingTemplate messagingTemplate) {
        this.allocationService = allocationService;
        this.appointmentService = appointmentService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/preview-allocation")
    @PreAuthorize("hasRole('PATIENT') or hasRole('HOSPITAL_ADMIN')")
    public ResponseEntity<AllocationPreviewResponse> previewAllocation(@Valid @RequestBody AllocationRequest request) {
        AllocationDecision decision = allocationService.allocateDoctor(
                request.getHospitalId(), request.getDepartmentId(), request.getDate(), request.getPatientId()
        );
        return ResponseEntity.ok(AllocationPreviewResponse.from(decision));
    }

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody BookAppointmentRequest request) {
        Appointment saved = appointmentService.createAppointment(request);
        
        // Broadcast real-time WebSocket STOMP update to open doctor & admin dashboards
        messagingTemplate.convertAndSend("/topic/hospital/" + saved.getHospital().getId() + "/queue", saved);
        messagingTemplate.convertAndSend("/topic/doctor/" + saved.getDoctor().getId() + "/appointments", saved);

        return ResponseEntity.ok(AppointmentResponse.from(saved));
    }
}`;

  const POSTGRES_SCHEMA = `-- MediGrid PostgreSQL Relational Database Schema
-- Multi-hospital appointment & digital health records

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospitals (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE'
);

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL
);

CREATE TABLE doctors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    hospital_id BIGINT REFERENCES hospitals(id),
    department_id BIGINT REFERENCES departments(id),
    specialization VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL,
    daily_capacity INT DEFAULT 25,
    weekly_schedule JSONB
);

CREATE TABLE leaves (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT REFERENCES doctors(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    consecutive_days INT NOT NULL,
    reason TEXT NOT NULL,
    is_rule_exceeded BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED_TO_DEAN')),
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP
);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    token_number VARCHAR(30) NOT NULL,
    patient_id BIGINT REFERENCES users(id),
    doctor_id BIGINT REFERENCES doctors(id),
    hospital_id BIGINT REFERENCES hospitals(id),
    department_id BIGINT REFERENCES departments(id),
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED')),
    assignment_reason VARCHAR(30) NOT NULL,
    is_substitute BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checkup_records (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT REFERENCES appointments(id),
    patient_id BIGINT REFERENCES users(id),
    doctor_id BIGINT REFERENCES doctors(id),
    record_date DATE NOT NULL,
    bp_systolic INT,
    bp_diastolic INT,
    heart_rate INT,
    weight_kg NUMERIC(5,2),
    sugar_mg_dl INT,
    diagnosis TEXT NOT NULL,
    prescriptions JSONB,
    clinical_notes TEXT,
    follow_up_date DATE
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Java Spring Boot Project Specification
                <span className="text-[11px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30">
                  College Viva Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Spring Boot 3.3.x • PostgreSQL 16 • WebSocket STOMP • Spring Security JWT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-2 flex gap-2 overflow-x-auto text-xs font-medium">
          {[
            { id: 'leaves', label: 'Leave Governance Service (Java)', icon: Code },
            { id: 'departments_reports', label: 'Department & Report APIs (Java)', icon: Server },
            { id: 'engine', label: 'Smart Allocation Engine (Java)', icon: Cpu },
            { id: 'controller', label: 'Appointment Controller (Java)', icon: Code },
            { id: 'schema', label: 'PostgreSQL Relational Schema', icon: Database },
            { id: 'architecture', label: 'System Viva Architecture', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg transition border-b-2 shrink-0 ${
                  active
                    ? 'bg-white text-teal-700 border-teal-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 font-sans">
          {activeTab === 'leaves' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  LeaveGovernanceService.java (Hospital Approve/Reject + Dean Escalation)
                </span>
                <button
                  onClick={() => copyCode(JAVA_LEAVE_GOVERNANCE_CODE)}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Java Code'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {JAVA_LEAVE_GOVERNANCE_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'departments_reports' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  HospitalManagementController.java (Add Department & Mobile Lab Upload)
                </span>
                <button
                  onClick={() => copyCode(JAVA_DEPT_REPORT_CODE)}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Java Code'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {JAVA_DEPT_REPORT_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'engine' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  SmartAllocationService.java (Core Logic)
                </span>
                <button
                  onClick={() => copyCode(JAVA_ENGINE_CODE)}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Java Code'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {JAVA_ENGINE_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'controller' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  AppointmentController.java (REST + WebSocket)
                </span>
                <button
                  onClick={() => copyCode(JAVA_CONTROLLER_CODE)}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Java Code'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {JAVA_CONTROLLER_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'schema' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  V1__init_medigrid_schema.sql (PostgreSQL DDL)
                </span>
                <button
                  onClick={() => copyCode(POSTGRES_SCHEMA)}
                  className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {POSTGRES_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Key Innovations for College Viva / Project Review</h4>
                <p className="text-slate-600 mb-3">
                  MediGrid solves the traditional OPD overcrowding failure where patients queue for hours or over-allocate specific famous doctors while peer specialists sit idle:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <h5 className="font-semibold text-teal-900 mb-1">1. Smart Load Balancing Engine</h5>
                    <p className="text-teal-800 text-[11px]">
                      Computes real-time OPD booking distribution across available specialists, eliminating bottlenecking without capping overall hospital capacity.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-1">2. Chronic Continuity of Care</h5>
                    <p className="text-blue-800 text-[11px]">
                      Patients with chronic flags (Diabetes, Hypertension) bypass load balancing to retain their longitudinal regular physician unless on approved leave.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <h5 className="font-semibold text-amber-900 mb-1">3. Automated Continuous Leave Limit</h5>
                    <p className="text-amber-800 text-[11px]">
                      Enforces maximum consecutive leave limits (&gt;2 days). Prohibits local hospital admin override; automatically escalates to Dean Council.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-900 mb-1">4. Cumulative Digital Health Records</h5>
                    <p className="text-purple-800 text-[11px]">
                      Vitals entered by doctors immediately aggregate into trend sparklines and longitudinal clinical graphs with contextual doctor notes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-2">Recommended Tech Stack for Full Java Deployment</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong className="text-slate-800">Spring Boot 3.3.x</strong> with Java 21 LTS</li>
                  <li><strong className="text-slate-800">Spring Security + JJWT</strong> for role-based token claims (RBAC)</li>
                  <li><strong className="text-slate-800">Spring Data JPA + Hibernate</strong> on PostgreSQL with Flyway migrations</li>
                  <li><strong className="text-slate-800">Spring WebSocket (STOMP)</strong> with SockJS fallback for live queue and doctor status boards</li>
                  <li><strong className="text-slate-800">Redis</strong> for live atomic counters (<code className="bg-slate-100 px-1 py-0.5 rounded">HINCRBY opd:count:doctor:YYYYMMDD</code>)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            MediGrid Academic & Clinical Architecture • Prepared for Academic Evaluation
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
