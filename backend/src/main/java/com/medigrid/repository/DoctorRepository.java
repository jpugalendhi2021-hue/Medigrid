package com.medigrid.repository;

import com.medigrid.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, String> {
    List<Doctor> findByHospitalId(String hospitalId);
    List<Doctor> findByDepartmentId(String departmentId);
    List<Doctor> findByHospitalIdAndDepartmentId(String hospitalId, String departmentId);
}
