package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.ChatMessage;
import com.project.campus_marketplace.model.Order;
import com.project.campus_marketplace.repository.ChatMessageRepository;
import com.project.campus_marketplace.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    // --- 1. INITIAL HANDSHAKE ACCEPTANCE (Your existing code) ---
    @PostMapping("/respond-offer/{messageId}")
    public ResponseEntity<?> respondToOffer(@PathVariable Integer messageId, @RequestBody Map<String, String> payload) {
        String response = payload.get("response");
        Integer buyerId = Integer.parseInt(payload.get("buyerId"));

        Optional<ChatMessage> msgOpt = chatMessageRepository.findById(messageId);
        if (msgOpt.isEmpty()) return ResponseEntity.notFound().build();

        ChatMessage message = msgOpt.get();

        if (!"PENDING".equals(message.getOfferStatus())) {
            return ResponseEntity.badRequest().body("Offer has already been processed.");
        }

        message.setOfferStatus(response);
        chatMessageRepository.save(message);

        if ("ACCEPTED".equals(response)) {
            Order order = new Order();
            order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            order.setBuyerId(buyerId);
            order.setMerchantId(message.getSenderId());
            order.setProductId(message.getProductId());
            order.setAgreedPrice(message.getOfferPrice());
            orderRepository.save(order);
        }

        ChatMessage systemTrigger = new ChatMessage();
        systemTrigger.setSenderId(message.getSenderId());
        systemTrigger.setReceiverId(message.getReceiverId());
        systemTrigger.setContent("SYSTEM_OFFER_UPDATE");

        messagingTemplate.convertAndSendToUser(String.valueOf(message.getSenderId()), "/queue/messages", systemTrigger);
        messagingTemplate.convertAndSendToUser(String.valueOf(message.getReceiverId()), "/queue/messages", systemTrigger);

        return ResponseEntity.ok(Map.of("message", "Offer " + response.toLowerCase()));
    }

    // --- 2. FETCH BUYER ORDERS (NEW) ---
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Order>> getBuyerOrders(@PathVariable Integer buyerId) {
        return ResponseEntity.ok(orderRepository.findByBuyerIdOrderByUpdatedAtDesc(buyerId));
    }

    // --- 3. FETCH MERCHANT ORDERS (NEW) ---
    @GetMapping("/merchant/{merchantId}")
    public ResponseEntity<List<Order>> getMerchantOrders(@PathVariable Integer merchantId) {
        return ResponseEntity.ok(orderRepository.findByMerchantIdOrderByUpdatedAtDesc(merchantId));
    }

    // --- 4. UPDATE ORDER STATE MACHINE (NEW) ---
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Integer orderId, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        Integer userId = Integer.parseInt(payload.get("userId"));

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

        Order order = orderOpt.get();

        if (!order.getBuyerId().equals(userId) && !order.getMerchantId().equals(userId)) {
            return ResponseEntity.status(403).body("Unauthorized to update this order.");
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        Integer notifyUserId = order.getBuyerId().equals(userId) ? order.getMerchantId() : order.getBuyerId();
        ChatMessage sysMsg = new ChatMessage();
        sysMsg.setSenderId(userId);
        sysMsg.setReceiverId(notifyUserId);
        sysMsg.setContent("SYSTEM_ORDER_UPDATE");
        messagingTemplate.convertAndSendToUser(String.valueOf(notifyUserId), "/queue/messages", sysMsg);

        return ResponseEntity.ok(savedOrder);
    }
}