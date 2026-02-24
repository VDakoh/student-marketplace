package com.project.campus_marketplace.service;

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

    public List<MerchantApplication> getPendingApplications() {
        return appRepository.findByStatus("PENDING");
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