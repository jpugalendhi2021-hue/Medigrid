package com.medigrid.service;

import com.medigrid.dto.CheckupSubmissionRequest;
import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckupService {

    private final CheckupRecordRepository checkupRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AuditLogRepository auditLogRepository;

    public CheckupRecord recordCheckup(CheckupSubmissionRequest req) {
        Appointment appt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + req.getAppointmentId()));

        Patient patient = patientRepository.findById(appt.getPatientId()).orElse(null);
        Doctor doctor = doctorRepository.findById(appt.getDoctorId()).orElse(null);

        // If a new chronic condition was diagnosed, add to patient's chronic list
        if (patient != null && req.getNewChronicCondition() != null && !req.getNewChronicCondition().isBlank()) {
            if (patient.getChronicConditions() == null) {
                patient.setChronicConditions(new ArrayList<>());
            }
            if (!patient.getChronicConditions().contains(req.getNewChronicCondition())) {
                patient.getChronicConditions().add(req.getNewChronicCondition());
                patientRepository.save(patient);
            }
        }

        // Mark appointment as completed
        appt.setStatus("completed");
        appointmentRepository.save(appt);

        CheckupRecord record = CheckupRecord.builder()
                .id("rec-" + UUID.randomUUID().toString().substring(0, 8))
                .appointmentId(appt.getId())
                .patientId(appt.getPatientId())
                .patientName(appt.getPatientName())
                .doctorId(appt.getDoctorId())
                .doctorName(appt.getDoctorName())
                .hospitalName(appt.getHospitalName())
                .date(LocalDate.now().toString())
                .bpSys(req.getBpSys())
                .bpDia(req.getBpDia())
                .sugarMgDl(req.getSugarMgDl())
                .weightKg(req.getWeightKg())
                .heartRate(req.getHeartRate())
                .diagnosis(req.getDiagnosis())
                .clinicalNotes(req.getClinicalNotes())
                .prescriptionsJson(req.getPrescriptionsJson())
                .followUpDate(req.getFollowUpDate())
                .createdAt(LocalDateTime.now())
                .build();

        CheckupRecord saved = checkupRecordRepository.save(record);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("CHECKUP_LOGGED")
                .actor(appt.getDoctorName())
                .target(appt.getPatientName())
                .details("BP: " + req.getBpSys() + "/" + req.getBpDia() + ", Diagnosis: " + req.getDiagnosis())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }
}
