package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "hospital_id", nullable = false)
    private String hospitalId;

    @Column(name = "department_id", nullable = false)
    private String departmentId;

    @Column(nullable = false)
    private String name;

    private String email;
    private String specialization;
    private String roomNumber;
    private String qualifications;
    private int experienceYears;

    @Builder.Default
    private boolean isAvailable = true;

    private int avgDailyCapacity;
    private int todayPatientCount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "doctor_weekly_schedule", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "day_of_week")
    private List<String> weeklySchedule;
}
