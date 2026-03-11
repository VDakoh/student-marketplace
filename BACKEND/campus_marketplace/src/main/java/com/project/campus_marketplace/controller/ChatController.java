package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.ChatMessage;
import com.project.campus_marketplace.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    // --- 1. REAL-TIME WEBSOCKET LISTENER ---
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        // Ensure timestamp is set
        chatMessage.setTimestamp(LocalDateTime.now());

        // Save to PostgreSQL permanently
        ChatMessage savedMsg = chatMessageRepository.save(chatMessage);

        // Instantly push the message to the receiver's private queue
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
        // Returns all messages for the user. React will group them by conversation.
        return ResponseEntity.ok(chatMessageRepository.findAllUserMessages(userId));
    }
}