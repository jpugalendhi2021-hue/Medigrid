package com.medigrid.repository;

import com.medigrid.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, String> {
    List<LeaveRequest> findByDoctorId(String doctorId);
    List<LeaveRequest> findByHospitalId(String hospitalId);
    List<LeaveRequest> findByStatus(String status);
}
