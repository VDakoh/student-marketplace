package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_shops")
public class FavoriteShop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "merchant_id", nullable = false)
    private Integer merchantId;

    @Column(name = "favorited_at", updatable = false)
    private LocalDateTime favoritedAt = LocalDateTime.now();

    public FavoriteShop() {}

    public FavoriteShop(Integer studentId, Integer merchantId) {
        this.studentId = studentId;
        this.merchantId = merchantId;
    }

    // --- Getters and Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }

    public Integer getMerchantId() { return merchantId; }
    public void setMerchantId(Integer merchantId) { this.merchantId = merchantId; }

    public LocalDateTime getFavoritedAt() { return favoritedAt; }
    public void setFavoritedAt(LocalDateTime favoritedAt) { this.favoritedAt = favoritedAt; }
}