package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private int age;
    private String gender;
    private String bloodGroup;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "patient_chronic_conditions", joinColumns = @JoinColumn(name = "patient_id"))
    @Column(name = "condition_name")
    private List<String> chronicConditions;

    @Column(name = "primary_doctor_id")
    private String primaryDoctorId;

    private String emergencyContact;
}
