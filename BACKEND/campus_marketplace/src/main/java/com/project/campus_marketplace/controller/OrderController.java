package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.ChatMessage;
import com.project.campus_marketplace.model.Order;
import com.project.campus_marketplace.repository.ChatMessageRepository;
import com.project.campus_marketplace.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/respond-offer/{messageId}")
    public ResponseEntity<?> respondToOffer(@PathVariable Integer messageId, @RequestBody Map<String, String> payload) {
        String response = payload.get("response"); // Expects "ACCEPTED" or "REJECTED"
        Integer buyerId = Integer.parseInt(payload.get("buyerId"));

        Optional<ChatMessage> msgOpt = chatMessageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChatMessage message = msgOpt.get();

        // Prevent double-processing
        if (!"PENDING".equals(message.getOfferStatus())) {
            return ResponseEntity.badRequest().body("Offer has already been processed.");
        }

        // 1. Update the chat message status
        message.setOfferStatus(response);
        chatMessageRepository.save(message);

        // 2. If accepted, generate the official Order ticket!
        if ("ACCEPTED".equals(response)) {
            Order order = new Order();
            order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            order.setBuyerId(buyerId);
            order.setMerchantId(message.getSenderId()); // The person who sent the offer is the merchant
            order.setProductId(message.getProductId());
            order.setAgreedPrice(message.getOfferPrice());
            orderRepository.save(order);
        }

        // 3. Fire a silent system trigger via WebSocket so React auto-refreshes the chat UI
        ChatMessage systemTrigger = new ChatMessage();
        systemTrigger.setSenderId(message.getSenderId());
        systemTrigger.setReceiverId(message.getReceiverId());
        systemTrigger.setContent("SYSTEM_OFFER_UPDATE");

        messagingTemplate.convertAndSendToUser(String.valueOf(message.getSenderId()), "/queue/messages", systemTrigger);
        messagingTemplate.convertAndSendToUser(String.valueOf(message.getReceiverId()), "/queue/messages", systemTrigger);

        return ResponseEntity.ok(Map.of("message", "Offer " + response.toLowerCase()));
    }
}