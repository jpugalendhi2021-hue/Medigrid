package com.medigrid.controller;

import com.medigrid.model.Appointment;
import com.medigrid.model.AuditLog;
import com.medigrid.model.CheckupRecord;
import com.medigrid.model.LabReport;
import com.medigrid.model.Patient;
import com.medigrid.repository.AppointmentRepository;
import com.medigrid.repository.AuditLogRepository;
import com.medigrid.repository.CheckupRecordRepository;
import com.medigrid.repository.LabReportRepository;
import com.medigrid.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final CheckupRecordRepository checkupRecordRepository;
    private final LabReportRepository labReportRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable String id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<Patient> getPatientByPhone(@PathVariable String phone) {
        String cleaned = phone.trim();
        return patientRepository.findByPhone(cleaned)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable String id) {
        return ResponseEntity.ok(appointmentRepository.findByPatientId(id));
    }

    @GetMapping("/{id}/records")
    public ResponseEntity<List<CheckupRecord>> getPatientRecords(@PathVariable String id) {
        return ResponseEntity.ok(checkupRecordRepository.findByPatientId(id));
    }

    @GetMapping("/{id}/labs")
    public ResponseEntity<List<LabReport>> getPatientLabReports(@PathVariable String id) {
        return ResponseEntity.ok(labReportRepository.findByPatientId(id));
    }

    @PostMapping
    public ResponseEntity<Patient> registerPatient(@RequestBody Patient patient) {
        if (patient.getId() == null || patient.getId().isEmpty()) {
            patient.setId("pat-" + UUID.randomUUID().toString().substring(0, 8));
        }
        return ResponseEntity.ok(patientRepository.save(patient));
    }

    @PostMapping("/upload-report-by-mobile")
    public ResponseEntity<LabReport> uploadReportByMobile(@RequestBody Map<String, Object> req) {
        String phone = req.get("phone") != null ? req.get("phone").toString().trim() : "";
        String patientName = req.get("patientName") != null ? req.get("patientName").toString().trim() : "";

        // 1. Locate patient by phone or auto-register walk-in patient profile
        Patient patient = patientRepository.findByPhone(phone)
                .orElseGet(() -> {
                    int age = req.containsKey("age") ? ((Number) req.get("age")).intValue() : 35;
                    String gender = req.get("gender") != null ? req.get("gender").toString() : "Other";
                    Patient newPat = Patient.builder()
                            .id("pat-" + UUID.randomUUID().toString().substring(0, 8))
                            .phone(phone)
                            .name(!patientName.isEmpty() ? patientName : "Walk-in Patient (" + phone + ")")
                            .gender(gender)
                            .age(age)
                            .email("walkin." + phone.replaceAll("[^0-9]", "") + "@medigrid.health")
                            .bloodGroup(req.get("bloodGroup") != null ? req.get("bloodGroup").toString() : "Unknown")
                            .build();
                    return patientRepository.save(newPat);
                });

        // 2. Assemble LabReport
        String title = req.get("title") != null ? req.get("title").toString() :
                req.get("testName") != null ? req.get("testName").toString() : "Diagnostic Laboratory Examination";
        String category = req.get("category") != null ? req.get("category").toString() :
                req.get("reportType") != null ? req.get("reportType").toString() : "Biochemistry";
        String dateStr = req.get("date") != null ? req.get("date").toString() : LocalDate.now().toString();
        String doctor = req.get("orderedBy") != null ? req.get("orderedBy").toString() :
                req.get("doctorName") != null ? req.get("doctorName").toString() : "Consulting Physician";
        String hospitalId = req.get("hospitalId") != null ? req.get("hospitalId").toString() : "hosp-1";
        String hospitalName = req.get("hospitalName") != null ? req.get("hospitalName").toString() : "Metro Central Multi-Specialty Hospital";
        String summary = req.get("summary") != null ? req.get("summary").toString() : "Diagnostic laboratory results reviewed and published.";
        String fileName = req.get("fileName") != null ? req.get("fileName").toString() : null;
        String fileUrl = req.get("fileUrl") != null ? req.get("fileUrl").toString() :
                req.get("fileData") != null ? req.get("fileData").toString() : null;

        LabReport report = LabReport.builder()
                .id("lab-" + UUID.randomUUID().toString().substring(0, 8))
                .patientId(patient.getId())
                .patientName(patient.getName())
                .mobileNumber(phone)
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .testName(title)
                .category(category)
                .date(dateStr)
                .laboratory(hospitalName + " - Central Pathology")
                .doctorName(doctor)
                .result("Published")
                .summary(summary)
                .status("ready")
                .fileName(fileName)
                .fileUrl(fileUrl)
                .uploadedAt(LocalDateTime.now())
                .build();

        LabReport saved = labReportRepository.save(report);

        // 3. Create Audit Trail
        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("LAB_REPORT_MOBILE_UPLOAD")
                .actor("Hospital Diagnostic Desk")
                .target(patient.getName() + " (" + phone + ")")
                .details("Uploaded diagnostic record '" + title + "' dispatched to mobile " + phone)
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }
}
