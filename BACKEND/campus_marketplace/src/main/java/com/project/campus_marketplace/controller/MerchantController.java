package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.service.MerchantApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/merchant")
public class MerchantController {

    private final MerchantApplicationService applicationService;

    public MerchantController(MerchantApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    // Notice we use @RequestParam for all fields when handling files
    @PostMapping("/apply")
    public ResponseEntity<String> applyForMerchant(
            @RequestParam("email") String email,
            @RequestParam("businessName") String businessName,
            @RequestParam("whatsappNumber") String whatsappNumber,
            @RequestParam("bio") String bio,
            @RequestParam("idCard") MultipartFile idCard,
            @RequestParam("beaMembership") MultipartFile beaMembership,
            @RequestParam("thirdDoc") MultipartFile thirdDoc) {

        String result = applicationService.submitApplication(
                email, businessName, whatsappNumber, bio, idCard, beaMembership, thirdDoc);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}