package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabReport {

    @Id
    private String id;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    private String patientName;
    private String mobileNumber;
    private String hospitalId;
    private String hospitalName;
    private String testName;
    private String category;
    private String date;
    private String laboratory;
    private String doctorName;
    private String result;
    @Column(length = 2000)
    private String summary;
    private String status; // ready, pending, flagged, normal
    private String fileUrl;
    private String fileName;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
