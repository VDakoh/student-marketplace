package com.project.campus_marketplace.service;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.model.MerchantProfile;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantApplicationRepository;
import com.project.campus_marketplace.repository.MerchantProfileRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;



@Service
public class MerchantApplicationService {

    private final MerchantApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final MerchantProfileRepository profileRepository;

    // The folder where files will be saved on your computer
    private final String UPLOAD_DIR = "uploads/merchant_docs/";

    public MerchantApplicationService(MerchantApplicationRepository applicationRepository, StudentRepository studentRepository, MerchantProfileRepository profileRepository) {
        this.applicationRepository = applicationRepository;
        this.studentRepository = studentRepository;
        this.profileRepository = profileRepository;
    }

    public String submitApplication(String email, String businessName, String mainProducts, String whatsappNumber, String bio,
                                    MultipartFile idCard, MultipartFile beaMembership, MultipartFile selfieImage) {

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
            String selfieImagePath = saveFile(selfieImage);

            // 4. Create and save the application record
            MerchantApplication application = new MerchantApplication();
            application.setStudentId(student.getId());
            application.setBusinessName(businessName);
            application.setWhatsappNumber(whatsappNumber);
            application.setBio(bio);
            application.setMainProducts(mainProducts); // New field
            application.setIdCardPath(idCardPath);
            application.setBeaMembershipPath(beaMembershipPath);
            application.setSelfieImagePath(selfieImagePath);
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

    // Make sure to import com.project.campus_marketplace.dto.MerchantApplicationDTO;

    public List<MerchantApplicationDTO> getMyApplications(String email) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return List.of(); // Return empty list if not found

        // Fetch all applications ordered by newest first
        List<MerchantApplication> apps = applicationRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());

        return apps.stream().map(app -> {
            MerchantApplicationDTO dto = new MerchantApplicationDTO();
            dto.setId(app.getId());
            dto.setBusinessName(app.getBusinessName());
            dto.setMainProducts(app.getMainProducts());
            dto.setWhatsappNumber(app.getWhatsappNumber());
            dto.setBio(app.getBio());
            dto.setStatus(app.getStatus());
            dto.setRejectionReason(app.getRejectionReason());
            dto.setCreatedAt(app.getCreatedAt().toString());
            return dto;
        }).toList();
    }

    public String completeSetup(String email) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return "Error: Student not found.";

        // Find their approved application
        MerchantApplication app = applicationRepository.findByStudentIdAndStatus(student.getId(), "APPROVED").orElse(null);
        if (app == null) return "Error: No approved application found.";

        // 1. Upgrade the user's role to MERCHANT
        student.setRole("MERCHANT");
        studentRepository.save(student);

        // 2. Initialize their official Merchant Profile! (Phase 2 Prep)
        if (profileRepository.findByStudentId(student.getId()).isEmpty()) {
            MerchantProfile profile = new MerchantProfile();
            profile.setStudentId(student.getId());
            profile.setBusinessName(app.getBusinessName());
            profile.setMerchantName(student.getFullName());
            profile.setMainProducts(app.getMainProducts());

            // Tagline has a 150 char strict limit in our DB, so we trim the bio if necessary
            String tagline = app.getBio().length() > 147 ? app.getBio().substring(0, 147) + "..." : app.getBio();
            profile.setTagline(tagline);

            profile.setDescription(app.getBio());
            profile.setPublicPhone(app.getWhatsappNumber());

            profileRepository.save(profile);
        }

        return "Success: Setup complete. User is now a Merchant.";
    }
}

