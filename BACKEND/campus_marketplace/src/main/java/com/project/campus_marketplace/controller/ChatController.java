package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.ChatMessage;
import com.project.campus_marketplace.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    // --- 1. REAL-TIME WEBSOCKET LISTENER ---
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());

        ChatMessage savedMsg = chatMessageRepository.save(chatMessage);

        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getReceiverId()),
                "/queue/messages",
                savedMsg
        );
    }

    // --- 2. REST API FOR CHAT HISTORY ---
    @GetMapping("/api/chat/history/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Integer userId1, @PathVariable Integer userId2) {
        return ResponseEntity.ok(chatMessageRepository.findChatHistory(userId1, userId2));
    }

    // --- 3. REST API FOR INBOX ---
    @GetMapping("/api/chat/inbox/{userId}")
    public ResponseEntity<List<ChatMessage>> getUserInbox(@PathVariable Integer userId) {
        return ResponseEntity.ok(chatMessageRepository.findAllUserMessages(userId));
    }

    // --- 4. NEW: REST API FOR FILE UPLOADS ---
    @PostMapping("/api/chat/upload")
    public ResponseEntity<?> uploadChatAttachments(@RequestParam("files") MultipartFile[] files) {
        if (files.length > 3) {
            return ResponseEntity.badRequest().body("Maximum of 3 file attachments allowed per message.");
        }

        List<String> filePaths = new ArrayList<>();
        String uploadDir = "uploads/chat_attachments/";

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        try {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // Generate a unique file name so users don't overwrite each other's files
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(uploadDir + fileName);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    filePaths.add(uploadDir + fileName);
                }
            }
            return ResponseEntity.ok(Map.of("urls", filePaths));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to upload attachments.");
        }
    }

    // --- 5. MARK MESSAGES AS READ (BULLETPROOF FIX) ---
    @PutMapping("/api/chat/read/{senderId}/{receiverId}")
    public ResponseEntity<?> markAsRead(@PathVariable Integer senderId, @PathVariable Integer receiverId) {
        // Fetch the exact conversation history
        List<ChatMessage> history = chatMessageRepository.findChatHistory(senderId, receiverId);
        for (ChatMessage msg : history) {
            if (msg.getSenderId().equals(senderId) && msg.getReceiverId().equals(receiverId) && !msg.isRead()) {
                msg.setRead(true);
                chatMessageRepository.save(msg);
            }
        }
        return ResponseEntity.ok().build();
    }

    // --- 6. GET TOTAL UNREAD COUNT ---
    @GetMapping("/api/chat/unread/{userId}")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Integer userId) {
        Long count = chatMessageRepository.countUnreadMessagesForUser(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}