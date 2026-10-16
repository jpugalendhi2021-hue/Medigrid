package com.medigrid.repository;

import com.medigrid.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findByHospitalId(String hospitalId);
    java.util.Optional<Department> findByHospitalIdAndCode(String hospitalId, String code);
}
