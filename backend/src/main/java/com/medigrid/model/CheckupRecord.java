package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkup_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckupRecord {

    @Id
    private String id;

    @Column(name = "appointment_id")
    private String appointmentId;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    private String patientName;

    @Column(name = "doctor_id", nullable = false)
    private String doctorId;

    private String doctorName;
    private String hospitalName;

    private String date; // YYYY-MM-DD

    // Vitals
    private int bpSys;
    private int bpDia;
    private int sugarMgDl;
    private double weightKg;
    private int heartRate;

    @Column(length = 2000)
    private String diagnosis;

    @Column(length = 4000)
    private String clinicalNotes;

    // Prescriptions JSON or summary
    @Column(length = 4000)
    private String prescriptionsJson;

    private String followUpDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
