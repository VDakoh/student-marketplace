package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchant_applications")
public class MerchantApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "whatsapp_number", nullable = false)
    private String whatsappNumber;

    @Column(columnDefinition = "TEXT")
    private String bio;

    // We will save the files to a folder on your computer and store the paths here
    @Column(name = "id_card_path")
    private String idCardPath;

    @Column(name = "bea_membership_path")
    private String beaMembershipPath;

    @Column(name = "selfie_image_path")
    private String selfieImagePath;

    // Status can be: PENDING, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "main_products")
    private String mainProducts;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();



    // --- Getters and Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getWhatsappNumber() { return whatsappNumber; }
    public void setWhatsappNumber(String whatsappNumber) { this.whatsappNumber = whatsappNumber; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getIdCardPath() { return idCardPath; }
    public void setIdCardPath(String idCardPath) { this.idCardPath = idCardPath; }

    public String getBeaMembershipPath() { return beaMembershipPath; }
    public void setBeaMembershipPath(String beaMembershipPath) { this.beaMembershipPath = beaMembershipPath; }

    public String getSelfieImagePath() { return selfieImagePath; }
    public void setSelfieImagePath(String thirdDocumentPath) { this.selfieImagePath = thirdDocumentPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMainProducts() {return mainProducts;}

    public void setMainProducts(String mainProducts) {this.mainProducts = mainProducts;}

    // Add these getters and setters at the bottom!
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // This tells Spring to automatically update the timestamp whenever the row is modified
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}