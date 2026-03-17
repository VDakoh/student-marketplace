package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "order_number", unique = true, nullable = false)
    private String orderNumber;

    @Column(name = "buyer_id", nullable = false)
    private Integer buyerId;

    @Column(name = "merchant_id", nullable = false)
    private Integer merchantId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "agreed_price", nullable = false)
    private Double agreedPrice;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, COMPLETED, CANCELLED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Order() {}

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Integer getBuyerId() { return buyerId; }
    public void setBuyerId(Integer buyerId) { this.buyerId = buyerId; }

    public Integer getMerchantId() { return merchantId; }
    public void setMerchantId(Integer merchantId) { this.merchantId = merchantId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Double getAgreedPrice() { return agreedPrice; }
    public void setAgreedPrice(Double agreedPrice) { this.agreedPrice = agreedPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}