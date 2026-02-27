package com.project.campus_marketplace.service;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantApplicationRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final MerchantApplicationRepository appRepository;
    private final StudentRepository studentRepository;

    public AdminService(MerchantApplicationRepository appRepository, StudentRepository studentRepository) {
        this.appRepository = appRepository;
        this.studentRepository = studentRepository;
    }

    // Notice the return type is now List<MerchantApplicationDTO>
    public List<MerchantApplicationDTO> getApplicationsByStatus(String status) {
        List<MerchantApplication> apps = appRepository.findByStatus(status.toUpperCase());

        return apps.stream().map(app -> {
            MerchantApplicationDTO dto = new MerchantApplicationDTO();
            dto.setId(app.getId());
            dto.setBusinessName(app.getBusinessName());
            dto.setMainProducts(app.getMainProducts());
            dto.setWhatsappNumber(app.getWhatsappNumber());
            dto.setBio(app.getBio());
            dto.setIdCardPath(app.getIdCardPath());
            dto.setBeaMembershipPath(app.getBeaMembershipPath());
            dto.setSelfieImagePath(app.getSelfieImagePath());
            dto.setStatus(app.getStatus());
            dto.setStudentId(app.getStudentId());

            // New Fields
            dto.setRejectionReason(app.getRejectionReason());
            dto.setCreatedAt(app.getCreatedAt().toString());

            // Fetch student name and their total application count
            studentRepository.findById(app.getStudentId()).ifPresent(student -> {
                dto.setStudentFullName(student.getFullName());
                dto.setTotalApplicationsByUser(appRepository.countByStudentId(student.getId()));
            });

            return dto;
        }).toList();
    }

    public String approveApplication(Integer applicationId) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        // We ONLY update the application status now. The user upgrades themselves later.
        app.setStatus("APPROVED");
        appRepository.save(app);

        return "Success: Application approved. User notified to complete setup.";
    }

    public String rejectApplication(Integer applicationId, String reason) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        app.setStatus("REJECTED");
        app.setRejectionReason(reason); // Save the admin's specific reason
        appRepository.save(app);

        return "Success: Application rejected.";
    }

    public List<MerchantApplicationDTO> getStudentApplicationHistory(Integer studentId) {
        List<MerchantApplication> history = appRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        return history.stream().map(app -> {
            MerchantApplicationDTO dto = new MerchantApplicationDTO();
            dto.setId(app.getId());
            dto.setStatus(app.getStatus());
            dto.setMainProducts(app.getMainProducts());
            dto.setRejectionReason(app.getRejectionReason());
            dto.setCreatedAt(app.getCreatedAt().toString());
            return dto;
        }).toList();
    }
}