package com.medigrid.repository;

import com.medigrid.model.CheckupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckupRecordRepository extends JpaRepository<CheckupRecord, String> {
    List<CheckupRecord> findByPatientId(String patientId);
    List<CheckupRecord> findByDoctorId(String doctorId);
}
