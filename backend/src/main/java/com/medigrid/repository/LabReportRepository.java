package com.medigrid.repository;

import com.medigrid.model.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabReportRepository extends JpaRepository<LabReport, String> {
    List<LabReport> findByPatientId(String patientId);
}
