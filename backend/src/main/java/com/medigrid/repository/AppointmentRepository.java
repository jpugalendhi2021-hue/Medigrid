package com.medigrid.repository;

import com.medigrid.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByDoctorIdAndDate(String doctorId, String date);
    List<Appointment> findByHospitalId(String hospitalId);
    List<Appointment> findByDepartmentId(String departmentId);
}
