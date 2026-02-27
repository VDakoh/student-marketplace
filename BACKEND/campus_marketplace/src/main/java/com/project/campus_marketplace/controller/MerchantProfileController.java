package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.MerchantProfile;
import com.project.campus_marketplace.service.MerchantProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/merchant/profile")
public class MerchantProfileController {

    private final MerchantProfileService profileService;

    public MerchantProfileController(MerchantProfileService profileService) {
        this.profileService = profileService;
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
}