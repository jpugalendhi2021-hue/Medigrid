package com.medigrid.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String actor;

    private String target;

    @Column(length = 2000)
    private String details;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
