package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantApplicationRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@Service
public class MerchantApplicationService {

    private final MerchantApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;

    // The folder where files will be saved on your computer
    private final String UPLOAD_DIR = "uploads/merchant_docs/";

    public MerchantApplicationService(MerchantApplicationRepository applicationRepository, StudentRepository studentRepository) {
        this.applicationRepository = applicationRepository;
        this.studentRepository = studentRepository;
    }

    public String submitApplication(String email, String businessName, String whatsappNumber, String bio,
                                    MultipartFile idCard, MultipartFile beaMembership, MultipartFile thirdDoc) {

        Optional<Student> studentOpt = studentRepository.findByBabcockEmail(email.toLowerCase());
        if (studentOpt.isEmpty()) {
            return "Error: User not found.";
        }

        Student student = studentOpt.get();

        // 1. Check if they are already a merchant
        if ("MERCHANT".equals(student.getRole())) {
            return "Error: User is already a merchant.";
        }

        // 2. Check if they already have a pending application
        if (applicationRepository.findByStudentIdAndStatus(student.getId(), "PENDING").isPresent()) {
            return "Error: You already have a pending application under review.";
        }

        try {
            // 3. Save the files and get their paths
            String idCardPath = saveFile(idCard);
            String beaMembershipPath = saveFile(beaMembership);
            String thirdDocPath = saveFile(thirdDoc);

            // 4. Create and save the application record
            MerchantApplication application = new MerchantApplication();
            application.setStudentId(student.getId());
            application.setBusinessName(businessName);
            application.setWhatsappNumber(whatsappNumber);
            application.setBio(bio);
            application.setIdCardPath(idCardPath);
            application.setBeaMembershipPath(beaMembershipPath);
            application.setThirdDocumentPath(thirdDocPath);
            // Status defaults to "PENDING" automatically from our model

            applicationRepository.save(application);

            return "Success: Application submitted successfully! An Admin will review your documents shortly.";

        } catch (IOException e) {
            return "Error: Failed to save uploaded documents. " + e.getMessage();
        }
    }

    // Helper method to save files securely
    private String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;

        // Create the uploads folder if it doesn't exist yet
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate a random string to prevent file name collisions (e.g., two students uploading "id.pdf")
        String uniqueFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(uniqueFileName);

        // Copy the file to the target location
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
    }
}