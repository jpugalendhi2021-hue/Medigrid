package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    private String id;

    @Column(name = "hospital_id", nullable = false)
    private String hospitalId;

    @Column(nullable = false)
    private String name;

    private String code;
    private String floor;
    private int dailyCapacity;
    private String iconName;
    private String headDoctorName;
    private String opdWing;
    private String phoneExtension;
}
