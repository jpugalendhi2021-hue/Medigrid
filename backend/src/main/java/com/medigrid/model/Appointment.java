package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    private String id;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    private String patientName;
    private int patientAge;
    private String patientGender;

    @Column(name = "hospital_id", nullable = false)
    private String hospitalId;

    private String hospitalName;

    @Column(name = "department_id", nullable = false)
    private String departmentId;

    private String departmentName;

    @Column(name = "doctor_id", nullable = false)
    private String doctorId;

    private String doctorName;
    private String roomNumber;

    private String date; // YYYY-MM-DD
    private String timeSlot;
    private String tokenNumber;
    private int queuePosition;

    // Status: confirmed, in-consultation, completed, cancelled, rescheduled
    @Column(nullable = false)
    private String status;

    private String symptoms;

    // Assignment reason: chronic-continuity, load-balance, emergency, direct, substitute
    private String assignmentReason;

    private String substituteReason;
    private String originalDoctorId;
    private String originalDoctorName;

    @Builder.Default
    private LocalDateTime bookedAt = LocalDateTime.now();
}
