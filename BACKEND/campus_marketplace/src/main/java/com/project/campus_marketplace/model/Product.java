package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Links this product directly to the merchant's Student ID
    @Column(nullable = false)
    private Integer merchantId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    // --- NEW TAXONOMY ENGINE ---

    @Column(nullable = false)
    private String listingType; // "ITEM" or "SERVICE"

    @Column(nullable = false)
    private String subType; // e.g., "Electronics & Gadgets", "Tech & Programming"

    @Column(nullable = false)
    private String category; // e.g., "Phones & Tablets", "Web Development"

    // Only populated if the user selects "Other..." in the category dropdown
    private String customCategory;

    // --- NULLABLE FIELDS (Because Services do not use these) ---
    private String itemCondition; // e.g., New, Used - Good (Null for Services)

    private Integer stockQuantity; // (Null or conceptually infinite for Services)

    private String imagePath; // Path to the uploaded product image

    private String status = "ACTIVE"; // ACTIVE, PAUSED, SOLD_OUT

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();


    // --- GETTERS AND SETTERS ---

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getMerchantId() { return merchantId; }
    public void setMerchantId(Integer merchantId) { this.merchantId = merchantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getListingType() { return listingType; }
    public void setListingType(String listingType) { this.listingType = listingType; }

    public String getSubType() { return subType; }
    public void setSubType(String subType) { this.subType = subType; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCustomCategory() { return customCategory; }
    public void setCustomCategory(String customCategory) { this.customCategory = customCategory; }

    public String getItemCondition() { return itemCondition; }
    public void setItemCondition(String itemCondition) { this.itemCondition = itemCondition; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}