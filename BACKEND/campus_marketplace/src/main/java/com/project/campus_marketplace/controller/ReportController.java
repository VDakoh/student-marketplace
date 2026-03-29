package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Report;
import com.project.campus_marketplace.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    // --- FOR BUYERS: Submit a new report ---
    @PostMapping("/submit")
    public ResponseEntity<?> submitReport(@RequestBody Report report) {
        try {
            Report savedReport = reportRepository.save(report);
            return ResponseEntity.ok(savedReport);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to submit report: " + e.getMessage());
        }
    }

    // --- FOR ADMINS: Fetch all reports ---
    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportRepository.findAllByOrderByCreatedAtDesc());
    }

    // --- FOR ADMINS: Update report status (Resolve or Dismiss) ---
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReportStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");

        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Report report = reportOpt.get();
        report.setStatus(newStatus);
        reportRepository.save(report);

        return ResponseEntity.ok(Map.of("message", "Report status updated to " + newStatus));
    }
}