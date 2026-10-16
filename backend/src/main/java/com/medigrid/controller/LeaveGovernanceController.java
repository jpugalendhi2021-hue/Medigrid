package com.medigrid.controller;

import com.medigrid.dto.LeaveSubmissionRequest;
import com.medigrid.model.LeaveRequest;
import com.medigrid.repository.LeaveRequestRepository;
import com.medigrid.service.LeaveGovernanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveGovernanceController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveGovernanceService leaveGovernanceService;

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAllLeaves() {
        return ResponseEntity.ok(leaveRequestRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<LeaveRequest> submitLeave(@RequestBody LeaveSubmissionRequest req) {
        return ResponseEntity.ok(leaveGovernanceService.submitLeave(req));
    }

    @PostMapping("/{id}/hospital-approve")
    public ResponseEntity<LeaveRequest> hospitalApprove(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String admin = body != null && body.containsKey("adminName") ? body.get("adminName") : "Hospital Administrator";
        return ResponseEntity.ok(leaveGovernanceService.hospitalApproveLeave(id, admin));
    }

    @PostMapping("/{id}/hospital-reject")
    public ResponseEntity<LeaveRequest> hospitalReject(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String admin = body != null && body.containsKey("adminName") ? body.get("adminName") : "Hospital Administrator";
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Hospital staffing quota requirement.";
        return ResponseEntity.ok(leaveGovernanceService.hospitalRejectLeave(id, admin, reason));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<LeaveRequest> approveAlias(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String admin = body != null && body.containsKey("adminName") ? body.get("adminName") : "Hospital Administrator";
        return ResponseEntity.ok(leaveGovernanceService.hospitalApproveLeave(id, admin));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<LeaveRequest> rejectAlias(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String admin = body != null && body.containsKey("adminName") ? body.get("adminName") : "Hospital Administrator";
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Staffing quota threshold.";
        return ResponseEntity.ok(leaveGovernanceService.hospitalRejectLeave(id, admin, reason));
    }

    @PostMapping("/{id}/dean-approve")
    public ResponseEntity<LeaveRequest> deanApprove(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String dean = body != null && body.containsKey("deanName") ? body.get("deanName") : "Dr. Arthur Vance (Dean)";
        String substituteDoctorId = body != null ? body.get("substituteDoctorId") : null;
        return ResponseEntity.ok(leaveGovernanceService.deanApproveLeave(id, dean, substituteDoctorId));
    }

    @PostMapping("/{id}/dean-reject")
    public ResponseEntity<LeaveRequest> deanReject(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String dean = body != null && body.containsKey("deanName") ? body.get("deanName") : "Dr. Arthur Vance (Dean)";
        String reason = body != null ? body.get("reason") : "Dispensation rejected by Dean Council.";
        return ResponseEntity.ok(leaveGovernanceService.deanRejectLeave(id, dean, reason));
    }
}
