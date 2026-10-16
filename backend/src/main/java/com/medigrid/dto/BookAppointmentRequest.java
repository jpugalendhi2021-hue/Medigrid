package com.medigrid.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookAppointmentRequest {
    private String patientId;
    private String hospitalId;
    private String departmentId;
    private String doctorId;
    private String date;
    private String timeSlot;
    private String symptoms;
    private String assignmentReason;
    private String substituteReason;
    private String originalDoctorId;
    private String originalDoctorName;
}
