package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.ChatMessage;
import com.project.campus_marketplace.model.Order;
import com.project.campus_marketplace.model.Product;
import com.project.campus_marketplace.repository.ChatMessageRepository;
import com.project.campus_marketplace.repository.OrderRepository;
import com.project.campus_marketplace.repository.ProductRepository;
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
    private ProductRepository productRepository; // Added for Step 7.5 Validation

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.project.campus_marketplace.service.NotificationService notificationService;

    // --- 1. INITIAL HANDSHAKE ACCEPTANCE ---
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

        // STEP 7.5 BACKEND VALIDATION: Ensure product is valid before accepting order
        if ("ACCEPTED".equals(response) && message.getProductId() != null) {
            Optional<Product> pOpt = productRepository.findById(message.getProductId());
            if (pOpt.isPresent()) {
                Product p = pOpt.get();
                if ("DISABLED".equalsIgnoreCase(p.getStatus())) {
                    return ResponseEntity.badRequest().body("Cannot accept offer. This listing is currently disabled.");
                }
                if ("ITEM".equalsIgnoreCase(p.getListingType()) && (p.getStockQuantity() == null || p.getStockQuantity() <= 0)) {
                    return ResponseEntity.badRequest().body("Cannot accept offer. This item is out of stock.");
                }
            }
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

        notificationService.sendNotification(
                message.getSenderId(),
                "Order Request Accepted!",
                "Your offer was accepted. Please check your Orders tab to process the transaction.",
                "ORDER",
                "/profile?tab=orders"
        );

        ChatMessage systemTrigger = new ChatMessage();
        systemTrigger.setSenderId(message.getSenderId());
        systemTrigger.setReceiverId(message.getReceiverId());
        systemTrigger.setContent("SYSTEM_OFFER_UPDATE");

        messagingTemplate.convertAndSendToUser(String.valueOf(message.getSenderId()), "/queue/messages", systemTrigger);
        messagingTemplate.convertAndSendToUser(String.valueOf(message.getReceiverId()), "/queue/messages", systemTrigger);

        return ResponseEntity.ok(Map.of("message", "Offer " + response.toLowerCase()));
    }

    // --- 2. FETCH BUYER ORDERS ---
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Order>> getBuyerOrders(@PathVariable Integer buyerId) {
        return ResponseEntity.ok(orderRepository.findByBuyerIdOrderByUpdatedAtDesc(buyerId));
    }

    // --- 3. FETCH MERCHANT ORDERS ---
    @GetMapping("/merchant/{merchantId}")
    public ResponseEntity<List<Order>> getMerchantOrders(@PathVariable Integer merchantId) {
        return ResponseEntity.ok(orderRepository.findByMerchantIdOrderByUpdatedAtDesc(merchantId));
    }

    // --- 4. UPDATE ORDER STATE MACHINE ---
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

        String alertMsg = "Your order status has been updated to: " + newStatus.replace("_", " ");
        notificationService.sendNotification(
                notifyUserId,
                "Order Status Updated",
                alertMsg,
                "ORDER",
                "/profile?tab=orders"
        );

        return ResponseEntity.ok(savedOrder);
    }

    // --- 5. SUBMIT TRI-FOLD RATING ---
    @PostMapping("/{orderId}/rate")
    public ResponseEntity<?> rateOrder(@PathVariable Integer orderId, @RequestBody Map<String, Object> payload) {
        Integer userId = Integer.parseInt(payload.get("userId").toString());
        Integer merchantRating = Integer.parseInt(payload.get("merchantRating").toString());
        Integer productRating = Integer.parseInt(payload.get("productRating").toString());
        String reviewText = (String) payload.getOrDefault("reviewText", "");

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

        Order order = orderOpt.get();

        // Security & Logic Checks
        if (!order.getBuyerId().equals(userId)) {
            return ResponseEntity.status(403).body("Only the buyer can rate this order.");
        }
        if (!"COMPLETED".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Only completed orders can be rated.");
        }
        if (order.getIsRated() != null && order.getIsRated()) {
            return ResponseEntity.badRequest().body("This order has already been rated.");
        }

        // Apply Ratings
        order.setMerchantRating(merchantRating);
        order.setProductRating(productRating);
        order.setReviewText(reviewText);
        order.setIsRated(true);
        orderRepository.save(order);

        // Ping the Merchant with the good news!
        notificationService.sendNotification(
                order.getMerchantId(),
                "New Rating Received! ⭐",
                "A buyer just left a " + merchantRating + "-star rating for your service. Keep up the great work!",
                "SYSTEM",
                "/shop/" + order.getMerchantId() // Link to their public shop to see the new score
        );

        return ResponseEntity.ok(Map.of("message", "Rating submitted successfully!"));
    }

    // --- 6. GET MERCHANT RATING STATS ---
    @GetMapping("/merchant/{merchantId}/ratings")
    public ResponseEntity<Map<String, Object>> getMerchantRatings(@PathVariable Integer merchantId) {
        // Fetch all orders for this merchant
        List<Order> allOrders = orderRepository.findByMerchantIdOrderByUpdatedAtDesc(merchantId);

        // Filter down to only the ones that have been rated
        List<Order> ratedOrders = allOrders.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsRated()))
                .toList();

        if (ratedOrders.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "totalReviews", 0,
                    "merchantAverage", 0.0,
                    "productAverage", 0.0,
                    "overallRating", 0.0
            ));
        }

        double sumMerchant = 0;
        double sumProduct = 0;

        for (Order o : ratedOrders) {
            sumMerchant += o.getMerchantRating() != null ? o.getMerchantRating() : 0;
            sumProduct += o.getProductRating() != null ? o.getProductRating() : 0;
        }

        int count = ratedOrders.size();
        double merchantAvg = sumMerchant / count;
        double productAvg = sumProduct / count;

        // YOUR 80/20 WEIGHTED MATH ALGORITHM
        double overall = (merchantAvg * 0.8) + (productAvg * 0.2);

        // Round everything to 1 decimal place (e.g., 4.6)
        return ResponseEntity.ok(Map.of(
                "totalReviews", count,
                "merchantAverage", Math.round(merchantAvg * 10.0) / 10.0,
                "productAverage", Math.round(productAvg * 10.0) / 10.0,
                "overallRating", Math.round(overall * 10.0) / 10.0
        ));
    }
}