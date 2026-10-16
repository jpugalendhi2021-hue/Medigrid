package com.medigrid.service;

import com.medigrid.dto.LeaveSubmissionRequest;
import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveGovernanceService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;

    public LeaveRequest submitLeave(LeaveSubmissionRequest req) {
        Doctor doctor = doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + req.getDoctorId()));

        Hospital hospital = hospitalRepository.findById(doctor.getHospitalId()).orElse(null);
        Department dept = departmentRepository.findById(doctor.getDepartmentId()).orElse(null);

        LocalDate start = LocalDate.parse(req.getStartDate());
        LocalDate end = LocalDate.parse(req.getEndDate());
        int days = (int) ChronoUnit.DAYS.between(start, end) + 1;

        boolean tripsConsecutiveRule = days > 2;

        LeaveRequest leave = LeaveRequest.builder()
                .id("leave-" + UUID.randomUUID().toString().substring(0, 8))
                .doctorId(doctor.getId())
                .doctorName(doctor.getName())
                .hospitalId(doctor.getHospitalId())
                .hospitalName(hospital != null ? hospital.getName() : "Metro Hospital")
                .departmentName(dept != null ? dept.getName() : "General Medicine")
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .consecutiveDays(days)
                .reason(req.getReason())
                .isRuleExceeded(tripsConsecutiveRule)
                .status(tripsConsecutiveRule ? "escalated_to_dean" : "pending_hospital")
                .createdAt(LocalDateTime.now())
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leave);

        // Record Audit
        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action(tripsConsecutiveRule ? "LEAVE_ESCALATED_DEAN" : "LEAVE_FILED_HOSPITAL")
                .actor(doctor.getName())
                .target("Leave Request (" + days + " days)")
                .details(tripsConsecutiveRule ?
                        "Exceeded 2-consecutive-day threshold. Escalated to Dean Council." :
                        "Routine leave filed for Hospital Admin approval.")
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    public LeaveRequest hospitalApproveLeave(String leaveId, String adminName) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        boolean isExtended = leave.isRuleExceeded() || "escalated_to_dean".equals(leave.getStatus()) || leave.getConsecutiveDays() > 2;

        leave.setStatus("approved");
        leave.setReviewedBy(adminName != null ? adminName : "Hospital Administrator");
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes(isExtended ?
                "Approved by Hospital Administration under emergency executive dispensation." :
                "Approved by Hospital Administration (Within 2-day limit).");

        LeaveRequest saved = leaveRequestRepository.save(leave);

        // Update doctor availability if leave active today
        if (leave.getStartDate() != null && leave.getEndDate() != null) {
            String today = LocalDate.now().toString();
            if (today.compareTo(leave.getStartDate()) >= 0 && today.compareTo(leave.getEndDate()) <= 0) {
                doctorRepository.findById(leave.getDoctorId()).ifPresent(doc -> {
                    doc.setAvailable(false);
                    doctorRepository.save(doc);
                });
            }
        }

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_LEAVE_APPROVED")
                .actor(adminName != null ? adminName : "Hospital Administrator")
                .target(leave.getDoctorName())
                .details("Approved leave of " + leave.getConsecutiveDays() + " days for " + leave.getDoctorName() + ".")
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    public LeaveRequest hospitalRejectLeave(String leaveId, String adminName, String reason) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        leave.setStatus("rejected");
        leave.setReviewedBy(adminName != null ? adminName : "Hospital Administrator");
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes(reason != null ? reason : "Disapproved by Hospital Administration due to staffing quotas and active OPD load.");

        LeaveRequest saved = leaveRequestRepository.save(leave);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("HOSPITAL_LEAVE_REJECTED")
                .actor(adminName != null ? adminName : "Hospital Administrator")
                .target(leave.getDoctorName())
                .details("Declined leave request for " + leave.getDoctorName() + ": " + leave.getReviewNotes())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    public LeaveRequest deanApproveLeave(String leaveId, String deanName, String substituteDoctorId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        leave.setStatus("approved");
        leave.setReviewedBy(deanName);
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes("Dispensation granted by Dean Council for " + leave.getConsecutiveDays() + " consecutive days.");

        if (substituteDoctorId != null) {
            doctorRepository.findById(substituteDoctorId).ifPresent(sub -> {
                leave.setSubstituteDoctorId(sub.getId());
                leave.setSubstituteDoctorName(sub.getName());
            });
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("DEAN_LEAVE_APPROVED")
                .actor(deanName)
                .target(leave.getDoctorName())
                .details("Dean Council approved extended leave of " + leave.getConsecutiveDays() + " days.")
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    public LeaveRequest deanRejectLeave(String leaveId, String deanName, String reason) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found: " + leaveId));

        leave.setStatus("rejected");
        leave.setReviewedBy(deanName);
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewNotes(reason != null ? reason : "Dean Council rejected extended leave to prevent clinical disruption.");

        LeaveRequest saved = leaveRequestRepository.save(leave);

        auditLogRepository.save(AuditLog.builder()
                .id("audit-" + UUID.randomUUID().toString().substring(0, 8))
                .action("DEAN_LEAVE_REJECTED")
                .actor(deanName)
                .target(leave.getDoctorName())
                .details("Rejected by Dean Council: " + leave.getReviewNotes())
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }
}
