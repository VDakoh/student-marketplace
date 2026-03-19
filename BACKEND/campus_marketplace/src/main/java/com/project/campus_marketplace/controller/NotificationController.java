package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Notification;
import com.project.campus_marketplace.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Integer userId) {
        return ResponseEntity.ok(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Integer userId) {
        return ResponseEntity.ok(Map.of("count", notificationRepository.countByRecipientIdAndIsReadFalse(userId)));
    }

    @PutMapping("/{userId}/mark-read")
    public ResponseEntity<?> markAllAsRead(@PathVariable Integer userId) {
        notificationRepository.markAllAsReadByRecipientId(userId);
        return ResponseEntity.ok().build();
    }
}