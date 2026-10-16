package com.medigrid.controller;

import com.medigrid.dto.AllocationPreviewRequest;
import com.medigrid.dto.AllocationPreviewResponse;
import com.medigrid.dto.BookAppointmentRequest;
import com.medigrid.dto.CheckupSubmissionRequest;
import com.medigrid.model.Appointment;
import com.medigrid.model.CheckupRecord;
import com.medigrid.repository.AppointmentRepository;
import com.medigrid.service.AppointmentService;
import com.medigrid.service.CheckupService;
import com.medigrid.service.DoctorAllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final DoctorAllocationService doctorAllocationService;
    private final AppointmentService appointmentService;
    private final CheckupService checkupService;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @PostMapping("/preview-allocation")
    public ResponseEntity<AllocationPreviewResponse> previewAllocation(@RequestBody AllocationPreviewRequest req) {
        return ResponseEntity.ok(doctorAllocationService.previewDoctorAllocation(req));
    }

    @PostMapping("/book")
    public ResponseEntity<Appointment> bookAppointment(@RequestBody BookAppointmentRequest req) {
        return ResponseEntity.ok(appointmentService.bookAppointment(req));
    }

    @PostMapping("/call-next/{doctorId}")
    public ResponseEntity<Appointment> callNextPatient(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.callNextPatient(doctorId));
    }

    @PostMapping("/submit-checkup")
    public ResponseEntity<CheckupRecord> submitCheckup(@RequestBody CheckupSubmissionRequest req) {
        return ResponseEntity.ok(checkupService.recordCheckup(req));
    }
}
