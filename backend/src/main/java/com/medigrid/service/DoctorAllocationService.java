package com.medigrid.service;

import com.medigrid.dto.AllocationPreviewRequest;
import com.medigrid.dto.AllocationPreviewResponse;
import com.medigrid.model.*;
import com.medigrid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DoctorAllocationService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AppointmentRepository appointmentRepository;

    public AllocationPreviewResponse previewDoctorAllocation(AllocationPreviewRequest request) {
        String patientId = request.getPatientId();
        String hospitalId = request.getHospitalId();
        String departmentId = request.getDepartmentId();
        String dateStr = request.getDate() != null ? request.getDate() : LocalDate.now().toString();

        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        List<Doctor> deptDoctors = doctorRepository.findByHospitalIdAndDepartmentId(hospitalId, departmentId);

        if (deptDoctors.isEmpty()) {
            throw new RuntimeException("No credentialed doctors found for hospital: " + hospitalId + " and department: " + departmentId);
        }

        // Determine Day of Week (e.g., "Mon", "Tue", "Wed")
        LocalDate date = LocalDate.parse(dateStr);
        String dayOfWeekShort = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

        // Check active approved leaves for doctors on this date
        List<LeaveRequest> approvedLeaves = leaveRequestRepository.findByStatus("approved");
        Set<String> onLeaveDoctorIds = new HashSet<>();
        for (LeaveRequest leave : approvedLeaves) {
            if (dateStr.compareTo(leave.getStartDate()) >= 0 && dateStr.compareTo(leave.getEndDate()) <= 0) {
                onLeaveDoctorIds.add(leave.getDoctorId());
            }
        }

        // 1. Check for Chronic Continuity (Patient's regular doctor)
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            String regularDoctorId = patient.getPrimaryDoctorId();

            if (regularDoctorId != null) {
                Optional<Doctor> regDocOpt = deptDoctors.stream()
                        .filter(d -> d.getId().equals(regularDoctorId))
                        .findFirst();

                if (regDocOpt.isPresent()) {
                    Doctor regDoc = regDocOpt.get();
                    boolean isOnLeave = onLeaveDoctorIds.contains(regDoc.getId()) || !regDoc.isAvailable();

                    if (!isOnLeave) {
                        int queueCount = appointmentRepository.findByDoctorIdAndDate(regDoc.getId(), dateStr).size();
                        return AllocationPreviewResponse.builder()
                                .assignedDoctor(regDoc)
                                .reason("chronic-continuity")
                                .explanation("Assigned to your regular physician for chronic condition continuity.")
                                .isRegularDoctorOnLeave(false)
                                .currentQueueLength(queueCount)
                                .estimatedWaitMinutes(Math.max(10, queueCount * 12))
                                .build();
                    } else {
                        // Regular doctor is on leave -> Find substitute
                        Doctor substitute = findLeastLoadedDoctor(deptDoctors, onLeaveDoctorIds, regDoc.getId());
                        int queueCount = substitute != null ?
                                appointmentRepository.findByDoctorIdAndDate(substitute.getId(), dateStr).size() : 0;

                        return AllocationPreviewResponse.builder()
                                .assignedDoctor(substitute)
                                .reason("substitute")
                                .explanation("Dr. " + regDoc.getName() + " is currently on sanctioned leave.")
                                .isRegularDoctorOnLeave(true)
                                .originalDoctor(regDoc)
                                .substituteNote("Your health history and longitudinal records will be automatically shared with the substitute specialist.")
                                .currentQueueLength(queueCount)
                                .estimatedWaitMinutes(Math.max(10, queueCount * 12))
                                .build();
                    }
                }
            }
        }

        // 2. Load-Balanced Allocation
        Doctor bestDoctor = findLeastLoadedDoctor(deptDoctors, onLeaveDoctorIds, null);
        if (bestDoctor == null) {
            bestDoctor = deptDoctors.get(0);
        }

        int queueCount = appointmentRepository.findByDoctorIdAndDate(bestDoctor.getId(), dateStr).size();

        return AllocationPreviewResponse.builder()
                .assignedDoctor(bestDoctor)
                .reason("load-balance")
                .explanation("Intelligently assigned based on today's OPD capacity & current shortest wait time.")
                .isRegularDoctorOnLeave(false)
                .currentQueueLength(queueCount)
                .estimatedWaitMinutes(Math.max(10, queueCount * 12))
                .build();
    }

    private Doctor findLeastLoadedDoctor(List<Doctor> doctors, Set<String> onLeaveIds, String excludeDoctorId) {
        return doctors.stream()
                .filter(d -> !onLeaveIds.contains(d.getId()))
                .filter(d -> excludeDoctorId == null || !d.getId().equals(excludeDoctorId))
                .min(Comparator.comparingDouble(d -> {
                    int cap = d.getAvgDailyCapacity() > 0 ? d.getAvgDailyCapacity() : 25;
                    return (double) d.getTodayPatientCount() / cap;
                }))
                .orElse(null);
    }
}
