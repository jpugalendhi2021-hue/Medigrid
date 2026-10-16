package com.medigrid.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveSubmissionRequest {
    private String doctorId;
    private String startDate; // YYYY-MM-DD
    private String endDate;   // YYYY-MM-DD
    private String reason;
}
