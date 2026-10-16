package com.medigrid.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckupSubmissionRequest {
    private String appointmentId;
    private int bpSys;
    private int bpDia;
    private int sugarMgDl;
    private double weightKg;
    private int heartRate;
    private String diagnosis;
    private String clinicalNotes;
    private String prescriptionsJson;
    private String newChronicCondition;
    private String followUpDate;
}
