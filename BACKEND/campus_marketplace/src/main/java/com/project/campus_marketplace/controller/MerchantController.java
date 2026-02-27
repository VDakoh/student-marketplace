package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.service.MerchantApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/merchant")
public class MerchantController {

    private final MerchantApplicationService applicationService;

    public MerchantController(MerchantApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    // Add this GET endpoint
    @GetMapping("/my-applications")
    public ResponseEntity<List<MerchantApplicationDTO>> getMyApplications(@RequestParam("email") String email) {
        return ResponseEntity.ok(applicationService.getMyApplications(email));
    }

    // Notice we use @RequestParam for all fields when handling files
    @PostMapping("/apply")
    public ResponseEntity<String> applyForMerchant(
            @RequestParam("email") String email,
            @RequestParam("businessName") String businessName,
            @RequestParam("mainProducts") String mainProducts, // New
            @RequestParam("whatsappNumber") String whatsappNumber,
            @RequestParam("bio") String bio,
            @RequestParam("idCard") MultipartFile idCard,
            @RequestParam("beaMembership") MultipartFile beaMembership,
            @RequestParam("selfieImage") MultipartFile selfieImage) { // Updated

        String result = applicationService.submitApplication(
                email, businessName, mainProducts, whatsappNumber, bio, idCard, beaMembership, selfieImage);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/complete-setup")
    public ResponseEntity<String> completeSetup(@RequestParam("email") String email) {
        String result = applicationService.completeSetup(email);
        if (result.startsWith("Error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }
}