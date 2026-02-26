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
    public List<MerchantApplicationDTO> getPendingApplications() {
        List<MerchantApplication> apps = appRepository.findByStatus("PENDING");

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

            // Fetch the student's full name from the Student table using their ID
            studentRepository.findById(app.getStudentId()).ifPresent(student -> {
                dto.setStudentFullName(student.getFullName());
            });

            return dto;
        }).toList();
    }

    public String approveApplication(Integer applicationId) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        // 1. Upgrade the user's role
        Student student = studentRepository.findById(app.getStudentId()).orElse(null);
        if (student != null) {
            student.setRole("MERCHANT");
            studentRepository.save(student);
        }

        // 2. Mark the application as approved
        app.setStatus("APPROVED");
        appRepository.save(app);

        return "Success: Application approved. User is now a Merchant!";
    }

    public String rejectApplication(Integer applicationId) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        app.setStatus("REJECTED");
        appRepository.save(app);

        return "Success: Application rejected.";
    }
}