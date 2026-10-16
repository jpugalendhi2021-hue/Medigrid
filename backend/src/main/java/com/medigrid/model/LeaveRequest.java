package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    private String id;

    @Column(name = "doctor_id", nullable = false)
    private String doctorId;

    private String doctorName;
    private String hospitalId;
    private String hospitalName;
    private String departmentName;

    private String startDate; // YYYY-MM-DD
    private String endDate;   // YYYY-MM-DD
    private int consecutiveDays;

    @Column(length = 1000)
    private String reason;

    // Status: pending_hospital, escalated_to_dean, approved, rejected
    @Column(nullable = false)
    private String status;

    private boolean isRuleExceeded; // true if consecutiveDays > 2

    private String substituteDoctorId;
    private String substituteDoctorName;

    private String reviewedBy;
    private String reviewNotes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime reviewedAt;
}
