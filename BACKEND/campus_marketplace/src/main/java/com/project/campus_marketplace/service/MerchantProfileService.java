package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.MerchantProfile;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantProfileRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
}