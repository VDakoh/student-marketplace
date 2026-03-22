package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private com.project.campus_marketplace.repository.AppealRepository appealRepository;

    @Autowired
    private com.project.campus_marketplace.repository.StudentRepository studentRepository;

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

    // --- DASHBOARD ANALYTICS ---
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        return ResponseEntity.ok(adminService.getSystemStatistics());
    }

    // --- USER MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<List<com.project.campus_marketplace.model.Student>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // --- PRODUCT MANAGEMENT ---
    @GetMapping("/products")
    public ResponseEntity<List<com.project.campus_marketplace.model.Product>> getAllProducts() {
        return ResponseEntity.ok(adminService.getAllProducts());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Integer id) {
        String result = adminService.deleteProduct(id);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<String> toggleUserSuspension(@PathVariable Integer id) {
        String result = adminService.toggleUserSuspension(id);
        if (result.startsWith("Error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }

    // --- 1. USER SUBMITS APPEAL ---
    @PostMapping("/appeals/submit")
    public ResponseEntity<?> submitAppeal(@RequestBody Map<String, Object> payload) {
        Integer studentId = Integer.parseInt(payload.get("studentId").toString());
        String reason = payload.get("reason").toString();

        com.project.campus_marketplace.model.Appeal appeal = new com.project.campus_marketplace.model.Appeal();
        appeal.setStudentId(studentId);
        appeal.setReason(reason);
        appealRepository.save(appeal);

        return ResponseEntity.ok(Map.of("message", "Appeal submitted successfully."));
    }

    // --- 2. USER VIEWS THEIR APPEALS ---
    @GetMapping("/appeals/user/{studentId}")
    public ResponseEntity<List<com.project.campus_marketplace.model.Appeal>> getUserAppeals(@PathVariable Integer studentId) {
        return ResponseEntity.ok(appealRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }

    // --- 3. ADMIN VIEWS ALL APPEALS ---
    @GetMapping("/appeals")
    public ResponseEntity<List<com.project.campus_marketplace.model.Appeal>> getAllAppeals() {
        return ResponseEntity.ok(appealRepository.findAllByOrderByCreatedAtDesc());
    }

    // --- 4. ADMIN RESOLVES APPEAL ---
    @PutMapping("/appeals/{appealId}/resolve")
    public ResponseEntity<?> resolveAppeal(@PathVariable Integer appealId, @RequestBody Map<String, String> payload) {
        String resolution = payload.get("status"); // 'APPROVED' or 'REJECTED'

        com.project.campus_marketplace.model.Appeal appeal = appealRepository.findById(appealId).orElse(null);
        if (appeal == null) return ResponseEntity.badRequest().body("Appeal not found.");

        appeal.setStatus(resolution);
        appealRepository.save(appeal);

        // If Approved, Reactivate the User!
        if ("APPROVED".equals(resolution)) {
            com.project.campus_marketplace.model.Student student = studentRepository.findById(appeal.getStudentId()).orElse(null);
            if (student != null) {
                student.setAccountStatus("ACTIVE");
                studentRepository.save(student);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Appeal marked as " + resolution));
    }
}