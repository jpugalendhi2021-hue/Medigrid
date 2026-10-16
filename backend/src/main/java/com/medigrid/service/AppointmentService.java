package com.medigrid.service;

import com.medigrid.dto.BookAppointmentRequest;
import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;

    public Appointment bookAppointment(BookAppointmentRequest req) {
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + req.getPatientId()));
        Doctor doctor = doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + req.getDoctorId()));
        Hospital hospital = hospitalRepository.findById(req.getHospitalId()).orElse(null);
        Department dept = departmentRepository.findById(req.getDepartmentId()).orElse(null);

        // Count existing appointments for this doctor on this day
        List<Appointment> existingForDoctor = appointmentRepository.findByDoctorIdAndDate(doctor.getId(), req.getDate());
        int queuePosition = existingForDoctor.size() + 1;

        String deptCode = dept != null && dept.getCode() != null ? dept.getCode() : "OPD";
        String tokenNumber = "TK-" + deptCode + "-" + String.format("%03d", queuePosition);

        Appointment appointment = Appointment.builder()
                .id("appt-" + UUID.randomUUID().toString().substring(0, 8))
                .patientId(patient.getId())
                .patientName(patient.getName())
                .patientAge(patient.getAge())
                .patientGender(patient.getGender())
                .hospitalId(doctor.getHospitalId())
                .hospitalName(hospital != null ? hospital.getName() : "Metro Hospital")
                .departmentId(doctor.getDepartmentId())
                .departmentName(dept != null ? dept.getName() : "General")
                .doctorId(doctor.getId())
                .doctorName(doctor.getName())
                .roomNumber(doctor.getRoomNumber())
                .date(req.getDate())
                .timeSlot(req.getTimeSlot())
                .tokenNumber(tokenNumber)
                .queuePosition(queuePosition)
                .status("confirmed")
                .symptoms(req.getSymptoms())
                .assignmentReason(req.getAssignmentReason() != null ? req.getAssignmentReason() : "load-balance")
                .substituteReason(req.getSubstituteReason())
                .originalDoctorId(req.getOriginalDoctorId())
                .originalDoctorName(req.getOriginalDoctorName())
                .bookedAt(LocalDateTime.now())
                .build();

        // Increment doctor's load count
        doctor.setTodayPatientCount(doctor.getTodayPatientCount() + 1);
        doctorRepository.save(doctor);

        Appointment saved = appointmentRepository.save(appointment);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("APPOINTMENT_SLOTTED")
                .actor("SYSTEM_ALLOCATION_ENGINE")
                .target(patient.getName() + " -> " + doctor.getName())
                .details("Token: " + tokenNumber + ", Reason: " + appointment.getAssignmentReason())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    public Appointment callNextPatient(String doctorId) {
        List<Appointment> appts = appointmentRepository.findByDoctorId(doctorId);

        // Complete any patient currently in consultation
        for (Appointment a : appts) {
            if ("in-consultation".equals(a.getStatus())) {
                a.setStatus("completed");
                appointmentRepository.save(a);
            }
        }

        // Find next confirmed patient
        Appointment next = appts.stream()
                .filter(a -> "confirmed".equals(a.getStatus()))
                .findFirst()
                .orElse(null);

        if (next != null) {
            next.setStatus("in-consultation");
            appointmentRepository.save(next);

            auditLogRepository.save(AuditLog.builder()
                    .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                    .action("PATIENT_CALLED_IN")
                    .actor(next.getDoctorName())
                    .target(next.getPatientName())
                    .details("Token " + next.getTokenNumber() + " ushered into " + next.getRoomNumber())
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        return next;
    }
}
