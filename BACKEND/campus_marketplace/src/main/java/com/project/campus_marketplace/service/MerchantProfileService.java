package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.MerchantProfile;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantProfileRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import io.jsonwebtoken.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class MerchantProfileService {

    private final MerchantProfileRepository profileRepository;
    private final StudentRepository studentRepository;

    public MerchantProfileService(MerchantProfileRepository profileRepository, StudentRepository studentRepository) {
        this.profileRepository = profileRepository;
        this.studentRepository = studentRepository;
    }

    // 1. Fetch the profile for the dashboard
    public MerchantProfile getProfileByEmail(String email) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return null;

        return profileRepository.findByStudentId(student.getId()).orElse(null);
    }

    // 2. The massive update function for the Sticky Save Bar
    public String updateProfile(String email, MerchantProfile updatedData) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return "Error: User not found.";

        MerchantProfile existingProfile = profileRepository.findByStudentId(student.getId()).orElse(null);
        if (existingProfile == null) return "Error: Profile not found.";

        // --- Update Tab 1 Data ---
        // (We will handle image uploads separately later, but let's prep the fields)
        if (updatedData.getLogoPath() != null) existingProfile.setLogoPath(updatedData.getLogoPath());
        if (updatedData.getBannerPath() != null) existingProfile.setBannerPath(updatedData.getBannerPath());

        // --- Update Tab 2 Data ---
        existingProfile.setBusinessName(updatedData.getBusinessName());
        existingProfile.setMainProducts(updatedData.getMainProducts());
        existingProfile.setTagline(updatedData.getTagline());
        existingProfile.setDescription(updatedData.getDescription());
        existingProfile.setPublicPhone(updatedData.getPublicPhone());
        existingProfile.setPublicEmail(updatedData.getPublicEmail());
        existingProfile.setInstagramLink(updatedData.getInstagramLink());
        existingProfile.setTwitterLink(updatedData.getTwitterLink());
        existingProfile.setTiktokLink(updatedData.getTiktokLink());
        existingProfile.setCampus(updatedData.getCampus());
        existingProfile.setPrimaryLocation(updatedData.getPrimaryLocation());
        existingProfile.setSpecificAddress(updatedData.getSpecificAddress());
        existingProfile.setAdditionalDirections(updatedData.getAdditionalDirections());

        // --- Update Tab 3 Data ---
        existingProfile.setStoreStatus(updatedData.getStoreStatus());
        existingProfile.setBusinessHours(updatedData.getBusinessHours());
        existingProfile.setBankName(updatedData.getBankName());
        existingProfile.setAccountNumber(updatedData.getAccountNumber());
        existingProfile.setAccountName(updatedData.getAccountName());
        existingProfile.setReturnPolicy(updatedData.getReturnPolicy());

        // --- Update Tab 4 Data ---
        existingProfile.setDeliveryMethods(updatedData.getDeliveryMethods());
        existingProfile.setDeliveryFeeType(updatedData.getDeliveryFeeType());
        existingProfile.setFlatDeliveryFee(updatedData.getFlatDeliveryFee());

        // Update the timestamp so we know when they last saved
        existingProfile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(existingProfile);
        return "Success: Profile updated successfully.";
    }

    // The new Image Upload Method
    public String uploadProfileImage(String email, MultipartFile file, String imageType) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return "Error: User not found.";

        MerchantProfile profile = profileRepository.findByStudentId(student.getId()).orElse(null);
        if (profile == null) return "Error: Profile not found.";

        try {
            // Create a specific folder for merchant profile images
            String uploadDir = "uploads/merchant_profiles/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate a unique file name so images don't overwrite each other
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = uploadDir + fileName;

            // Update the specific column in the database
            if ("logo".equalsIgnoreCase(imageType)) {
                profile.setLogoPath(fileUrl);
            } else if ("banner".equalsIgnoreCase(imageType)) {
                profile.setBannerPath(fileUrl);
            }

            profile.setUpdatedAt(LocalDateTime.now());
            profileRepository.save(profile);

            return fileUrl; // Return the new path to React
        } catch (Exception e) {
            return "Error: Could not save image.";
        }
    }

    public String removeProfileImage(String email, String imageType) {
        Student student = studentRepository.findByBabcockEmail(email).orElse(null);
        if (student == null) return "Error: User not found.";

        MerchantProfile profile = profileRepository.findByStudentId(student.getId()).orElse(null);
        if (profile == null) return "Error: Profile not found.";

        String pathToRemove = null;
        if ("logo".equalsIgnoreCase(imageType)) {
            pathToRemove = profile.getLogoPath();
            profile.setLogoPath(null); // Clear DB reference
        } else if ("banner".equalsIgnoreCase(imageType)) {
            pathToRemove = profile.getBannerPath();
            profile.setBannerPath(null); // Clear DB reference
        }

        // If there's a file, delete it from disk
        if (pathToRemove != null) {
            try {
                // Convert URL path (uploads/file.jpg) back to system file path
                Path filePath = Paths.get(pathToRemove);
                Files.deleteIfExists(filePath);
            } catch (IOException | java.io.IOException e) {
                System.err.println("Warning: Could not delete file from disk: " + pathToRemove);
                // We still continue to save the DB change even if disk deletion fails
            }
        }

        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);
        return "Success: Image removed.";
    }
}