package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospital {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String district;

    private String address;
    private String contact;
    private String status; // active, maintenance

    private String adminName;
    private String adminEmail;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
