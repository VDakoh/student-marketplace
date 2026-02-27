package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/applications/{status}")
    public ResponseEntity<List<MerchantApplicationDTO>> getApplicationsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(adminService.getApplicationsByStatus(status));
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
    public ResponseEntity<String> rejectApplication(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String reason = payload.getOrDefault("reason", "No reason provided.");
        return ResponseEntity.ok(adminService.rejectApplication(id, reason));
    }

    @GetMapping("/applications/history/{studentId}")
    public ResponseEntity<List<MerchantApplicationDTO>> getApplicationHistory(@PathVariable Integer studentId) {
        return ResponseEntity.ok(adminService.getStudentApplicationHistory(studentId));
    }
}