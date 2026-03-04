package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.SavedItem;
import com.project.campus_marketplace.repository.SavedItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/saved-items")
public class SavedItemController {

    @Autowired
    private SavedItemRepository savedItemRepository;

    // Toggle save/unsave
    @PostMapping("/toggle")
    @Transactional
    public ResponseEntity<?> toggleSavedItem(@RequestBody Map<String, Integer> payload) {
        Integer studentId = payload.get("studentId");
        Integer productId = payload.get("productId");

        if (studentId == null || productId == null) {
            return ResponseEntity.badRequest().body("Missing studentId or productId");
        }

        Optional<SavedItem> existing = savedItemRepository.findByStudentIdAndProductId(studentId, productId);

        if (existing.isPresent()) {
            // It's already saved, so "unsave" it
            savedItemRepository.deleteByStudentIdAndProductId(studentId, productId);
            return ResponseEntity.ok(Map.of("saved", false, "message", "Item removed from saved list"));
        } else {
            // Not saved yet, so save it
            SavedItem newItem = new SavedItem(studentId, productId);
            savedItemRepository.save(newItem);
            return ResponseEntity.ok(Map.of("saved", true, "message", "Item saved successfully"));
        }
    }

    // Get all saved items for a specific user
    @GetMapping("/{studentId}")
    public ResponseEntity<List<SavedItem>> getUserSavedItems(@PathVariable Integer studentId) {
        return ResponseEntity.ok(savedItemRepository.findByStudentIdOrderBySavedAtDesc(studentId));
    }
}