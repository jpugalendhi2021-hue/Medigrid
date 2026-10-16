package com.medigrid.controller;

import com.medigrid.model.AuditLog;
import com.medigrid.model.Department;
import com.medigrid.model.Hospital;
import com.medigrid.repository.AuditLogRepository;
import com.medigrid.repository.DepartmentRepository;
import com.medigrid.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalController {

    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/hospitals")
    public ResponseEntity<List<Hospital>> getAllHospitals() {
        return ResponseEntity.ok(hospitalRepository.findAll());
    }

    @GetMapping("/hospitals/{id}")
    public ResponseEntity<Hospital> getHospitalById(@PathVariable String id) {
        return hospitalRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hospitals/{id}/departments")
    public ResponseEntity<List<Department>> getHospitalDepartments(@PathVariable String id) {
        return ResponseEntity.ok(departmentRepository.findByHospitalId(id));
    }

    @PostMapping("/hospitals")
    public ResponseEntity<Hospital> createHospital(@RequestBody Hospital hospital) {
        return ResponseEntity.ok(hospitalRepository.save(hospital));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        if (department.getId() == null || department.getId().isEmpty()) {
            department.setId("dept-" + UUID.randomUUID().toString().substring(0, 8));
        }
        Department saved = departmentRepository.save(department);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("DEPARTMENT_CREATED")
                .actor("Hospital Administrator")
                .target(department.getName())
                .details("Created clinical unit " + department.getName() + " (" + department.getCode() + ") with capacity " + department.getDailyCapacity())
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/hospitals/{hospitalId}/departments")
    public ResponseEntity<Department> addDepartmentToHospital(
            @PathVariable String hospitalId,
            @RequestBody Department department
    ) {
        department.setHospitalId(hospitalId);
        if (department.getId() == null || department.getId().isEmpty()) {
            department.setId("dept-" + UUID.randomUUID().toString().substring(0, 8));
        }
        Department saved = departmentRepository.save(department);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_DEPARTMENT_ADDED")
                .actor("Hospital Administrator")
                .target(department.getName())
                .details("Added clinical department " + department.getName() + " to hospital " + hospitalId)
                .timestamp(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(saved);
    }
}
