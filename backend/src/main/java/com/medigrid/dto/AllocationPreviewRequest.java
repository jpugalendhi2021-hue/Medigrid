package com.medigrid.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllocationPreviewRequest {
    private String patientId;
    private String hospitalId;
    private String departmentId;
    private String date; // YYYY-MM-DD
}
