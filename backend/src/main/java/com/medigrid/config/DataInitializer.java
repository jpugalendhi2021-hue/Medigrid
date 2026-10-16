package com.medigrid.config;

import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final CheckupRecordRepository checkupRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LabReportRepository labReportRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public void run(String... args) {
        log.info("Initializing MediGrid Multi-Hospital Data Seed in Java Backend...");

        // 1. Hospitals
        Hospital h1 = Hospital.builder()
                .id("hosp-1")
                .name("Metro Central Hospital")
                .district("Central District")
                .address("104 Medical Plaza, Connaught Sector")
                .contact("+91 22 4988 2000")
                .status("active")
                .adminName("Col. Rajesh Kapoor")
                .adminEmail("admin.metro@medigrid.health")
                .build();

        Hospital h2 = Hospital.builder()
                .id("hosp-2")
                .name("St. Jude Medical Institute")
                .district("East Health Corridor")
                .address("88 Lakeview Parkway, Sector 4")
                .contact("+91 22 6120 4500")
                .status("active")
                .adminName("Dr. Anita Sen")
                .adminEmail("admin.stjude@medigrid.health")
                .build();

        Hospital h3 = Hospital.builder()
                .id("hosp-3")
                .name("Apex Regional Health Center")
                .district("North Hills District")
                .address("12 Highland Ring Road")
                .contact("+91 22 8840 9100")
                .status("active")
                .adminName("Sunil Mukherjee")
                .adminEmail("admin.apex@medigrid.health")
                .build();

        hospitalRepository.saveAll(Arrays.asList(h1, h2, h3));

        // 2. Departments
        Department d1_1 = Department.builder().id("dept-1-1").hospitalId("hosp-1").name("Cardiology").code("CARD").floor("3rd Floor - Wing A").dailyCapacity(40).build();
        Department d1_2 = Department.builder().id("dept-1-2").hospitalId("hosp-1").name("Endocrinology & Diabetology").code("ENDO").floor("2nd Floor - Wing B").dailyCapacity(35).build();
        Department d1_3 = Department.builder().id("dept-1-3").hospitalId("hosp-1").name("Orthopedics & Joint Care").code("ORTHO").floor("1st Floor - Wing C").dailyCapacity(50).build();

        Department d2_1 = Department.builder().id("dept-2-1").hospitalId("hosp-2").name("Cardiology").code("CARD").floor("Tower 1, Level 4").dailyCapacity(45).build();
        Department d2_2 = Department.builder().id("dept-2-2").hospitalId("hosp-2").name("Endocrinology & Diabetology").code("ENDO").floor("Tower 2, Level 2").dailyCapacity(30).build();

        departmentRepository.saveAll(Arrays.asList(d1_1, d1_2, d1_3, d2_1, d2_2));

        // 3. Doctors
        Doctor doc1 = Doctor.builder()
                .id("doc-1")
                .userId("u-doc-1")
                .hospitalId("hosp-1")
                .departmentId("dept-1-2")
                .name("Dr. Priya Rao")
                .email("dr.priyarao@medigrid.health")
                .specialization("Senior Endocrinologist")
                .roomNumber("OPD Room 204")
                .qualifications("MBBS, MD (Endocrinology), FRCP")
                .experienceYears(14)
                .isAvailable(true)
                .avgDailyCapacity(30)
                .todayPatientCount(14)
                .weeklySchedule(Arrays.asList("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"))
                .build();

        Doctor doc2 = Doctor.builder()
                .id("doc-2")
                .userId("u-doc-2")
                .hospitalId("hosp-1")
                .departmentId("dept-1-2")
                .name("Dr. Sameer Khan")
                .email("dr.sameerkhan@medigrid.health")
                .specialization("Consultant Diabetologist")
                .roomNumber("OPD Room 206")
                .qualifications("MBBS, DNB (Internal Medicine)")
                .experienceYears(9)
                .isAvailable(true)
                .avgDailyCapacity(28)
                .todayPatientCount(6)
                .weeklySchedule(Arrays.asList("Mon", "Wed", "Fri"))
                .build();

        Doctor doc3 = Doctor.builder()
                .id("doc-3")
                .userId("u-doc-3")
                .hospitalId("hosp-1")
                .departmentId("dept-1-1")
                .name("Dr. Vikram Malhotra")
                .email("dr.vikram@medigrid.health")
                .specialization("Chief Interventional Cardiologist")
                .roomNumber("OPD Room 312")
                .qualifications("MBBS, DM (Cardiology), FACC")
                .experienceYears(19)
                .isAvailable(true)
                .avgDailyCapacity(25)
                .todayPatientCount(18)
                .weeklySchedule(Arrays.asList("Mon", "Tue", "Thu", "Fri"))
                .build();

        doctorRepository.saveAll(Arrays.asList(doc1, doc2, doc3));

        // 4. Patients
        Patient p1 = Patient.builder()
                .id("pat-1")
                .userId("u-pat-1")
                .name("Arjun Sharma")
                .email("arjun.sharma@example.com")
                .phone("+91 98201 45892")
                .age(52)
                .gender("Male")
                .bloodGroup("B+ Positive")
                .chronicConditions(Arrays.asList("Type 2 Diabetes Mellitus", "Essential Hypertension"))
                .primaryDoctorId("doc-1")
                .emergencyContact("+91 98201 45899 (Spouse)")
                .build();

        Patient p2 = Patient.builder()
                .id("pat-2")
                .userId("u-pat-2")
                .name("Meera Nair")
                .email("meera.nair@example.com")
                .phone("+91 97402 12093")
                .age(41)
                .gender("Female")
                .bloodGroup("O+ Positive")
                .chronicConditions(List.of("Coronary Artery Disease"))
                .primaryDoctorId("doc-3")
                .emergencyContact("+91 97402 12090 (Brother)")
                .build();

        patientRepository.saveAll(Arrays.asList(p1, p2));

        // 5. Initial Checkup Records (Longitudinal Vitals)
        CheckupRecord rec1 = CheckupRecord.builder()
                .id("rec-1")
                .patientId("pat-1")
                .patientName("Arjun Sharma")
                .doctorId("doc-1")
                .doctorName("Dr. Priya Rao")
                .hospitalName("Metro Central Hospital")
                .date("2026-06-10")
                .bpSys(138)
                .bpDia(88)
                .sugarMgDl(148)
                .weightKg(79.0)
                .heartRate(76)
                .diagnosis("Type 2 Diabetes review. Blood sugar mildly elevated.")
                .clinicalNotes("Continue Metformin 500mg. Recommended 30 mins brisk walking.")
                .followUpDate("2026-07-20")
                .build();

        CheckupRecord rec2 = CheckupRecord.builder()
                .id("rec-2")
                .patientId("pat-1")
                .patientName("Arjun Sharma")
                .doctorId("doc-1")
                .doctorName("Dr. Priya Rao")
                .hospitalName("Metro Central Hospital")
                .date("2026-08-15")
                .bpSys(128)
                .bpDia(82)
                .sugarMgDl(132)
                .weightKg(77.5)
                .heartRate(72)
                .diagnosis("Glycemic parameters showing sustained improvement.")
                .clinicalNotes("HbA1c down from 7.4% to 6.9%. BP well controlled.")
                .followUpDate("2026-09-05")
                .build();

        checkupRecordRepository.saveAll(Arrays.asList(rec1, rec2));

        // 6. Dean Escalation Leave Seed & Routine Pending Leave
        LeaveRequest leaveEscalated = LeaveRequest.builder()
                .id("leave-101")
                .doctorId("doc-3")
                .doctorName("Dr. Vikram Malhotra")
                .hospitalId("hosp-1")
                .hospitalName("Metro Central Hospital")
                .departmentName("Cardiology")
                .startDate("2026-09-14")
                .endDate("2026-09-18")
                .consecutiveDays(5)
                .reason("Attending World Cardiology Summit 2026 & presenting surgical paper.")
                .isRuleExceeded(true)
                .status("escalated_to_dean")
                .createdAt(LocalDateTime.now())
                .build();

        LeaveRequest leaveRoutine = LeaveRequest.builder()
                .id("leave-102")
                .doctorId("doc-2")
                .doctorName("Dr. Sameer Khan")
                .hospitalId("hosp-1")
                .hospitalName("Metro Central Hospital")
                .departmentName("Endocrinology & Diabetology")
                .startDate("2026-09-20")
                .endDate("2026-09-21")
                .consecutiveDays(2)
                .reason("Family medical duty & regional CME certification.")
                .isRuleExceeded(false)
                .status("pending")
                .createdAt(LocalDateTime.now())
                .build();

        leaveRequestRepository.saveAll(Arrays.asList(leaveEscalated, leaveRoutine));

        // 7. Seed Diagnostic Lab Report (linked to mobile)
        LabReport lab1 = LabReport.builder()
                .id("lab-101")
                .patientId("pat-1")
                .patientName("Arjun Sharma")
                .mobileNumber("+91 98201 45892")
                .hospitalId("hosp-1")
                .hospitalName("Metro Central Hospital")
                .testName("Glycated Hemoglobin (HbA1c) & Fasting Lipid Panel")
                .category("Biochemistry")
                .date("2026-08-15")
                .laboratory("Metro Central Pathology Wing")
                .doctorName("Dr. Priya Rao")
                .result("Published")
                .summary("Fasting plasma glucose 132 mg/dL. HbA1c at 6.9%. Improved glycemic control.")
                .status("ready")
                .uploadedAt(LocalDateTime.now())
                .build();

        labReportRepository.save(lab1);

        // 8. Audit Log
        auditLogRepository.save(AuditLog.builder()
                .id("audit-init-1")
                .action("SYSTEM_BOOTSTRAP")
                .actor("MediGrid Core")
                .target("All Units")
                .details("Java Spring Boot Backend initialized with 3 regional hospitals and OPD routing engine.")
                .timestamp(LocalDateTime.now())
                .build());

        log.info("MediGrid Data Initialization Complete! REST endpoints active.");
    }
}
