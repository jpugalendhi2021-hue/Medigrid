package com.medigrid.controller;

import com.medigrid.model.Appointment;
import com.medigrid.model.Doctor;
import com.medigrid.repository.AppointmentRepository;
import com.medigrid.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable String id) {
        return doctorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/queue")
    public ResponseEntity<List<Appointment>> getDoctorTodayQueue(
            @PathVariable String id,
            @RequestParam(required = false) String date
    ) {
        String targetDate = date != null ? date : LocalDate.now().toString();
        return ResponseEntity.ok(appointmentRepository.findByDoctorIdAndDate(id, targetDate));
    }
}
