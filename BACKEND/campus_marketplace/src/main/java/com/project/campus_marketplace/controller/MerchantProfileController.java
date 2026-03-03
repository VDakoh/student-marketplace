package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.repository.MerchantProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.project.campus_marketplace.model.MerchantProfile;
import com.project.campus_marketplace.service.MerchantProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/merchant/profile")
public class MerchantProfileController {

    private final MerchantProfileService profileService;

    @Autowired
    private MerchantProfileRepository profileRepository;

    public MerchantProfileController(MerchantProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/shop/{identifier}")
    public ResponseEntity<MerchantProfile> getShopProfile(@PathVariable String identifier) {
        try {
            // 1. If it's purely a numeric ID (Used by ProductDetail sidebar)
            if (identifier.matches("\\d+")) {
                Integer merchantId = Integer.parseInt(identifier);
                return profileRepository.findByStudentId(merchantId)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            }

            // 2. If it's a generated shop slug (Used for public URLs)
            String[] parts = identifier.split("-shopid");
            if (parts.length != 2) return ResponseEntity.badRequest().build();

            Integer merchantId = Integer.parseInt(parts[1]);

            return profileRepository.findByStudentId(merchantId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<MerchantProfile> getProfile(@RequestParam("email") String email) {
        MerchantProfile profile = profileService.getProfileByEmail(email);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<String> updateProfile(@RequestParam("email") String email, @RequestBody MerchantProfile updatedData) {
        String result = profileService.updateProfile(email, updatedData);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(
            @RequestParam("email") String email,
            @RequestParam("imageType") String imageType,
            @RequestParam("file") MultipartFile file) {

        String result = profileService.uploadProfileImage(email, file, imageType);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/remove-image")
    public ResponseEntity<String> removeImage(
            @RequestParam("email") String email,
            @RequestParam("imageType") String imageType) {

        String result = profileService.removeProfileImage(email, imageType);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}