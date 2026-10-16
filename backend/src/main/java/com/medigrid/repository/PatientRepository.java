package com.medigrid.repository;

import com.medigrid.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByUserId(String userId);
    Optional<Patient> findByPhone(String phone);
}
