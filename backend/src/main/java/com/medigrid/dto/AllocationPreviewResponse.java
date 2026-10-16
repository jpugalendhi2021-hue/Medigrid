package com.medigrid.dto;

import com.medigrid.model.Doctor;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllocationPreviewResponse {
    private Doctor assignedDoctor;
    private String reason; // chronic-continuity, load-balance, emergency, direct, substitute
    private String explanation;
    private boolean isRegularDoctorOnLeave;
    private Doctor originalDoctor;
    private String substituteNote;
    private int estimatedWaitMinutes;
    private int currentQueueLength;
}
