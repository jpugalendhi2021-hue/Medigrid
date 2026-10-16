package com.medigrid.repository;

import com.medigrid.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, String> {
    List<Hospital> findByDistrict(String district);
}
