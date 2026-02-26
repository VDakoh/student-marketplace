package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/applications/pending")
    public ResponseEntity<List<MerchantApplicationDTO>> getPendingApplications() {
        return ResponseEntity.ok(adminService.getPendingApplications());
    }

    @PostMapping("/applications/{id}/approve")
    public ResponseEntity<String> approveApplication(@PathVariable Integer id) {
        String result = adminService.approveApplication(id);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<String> rejectApplication(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.rejectApplication(id));
    }
}