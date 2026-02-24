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

    @Column(name = "third_document_path")
    private String thirdDocumentPath;

    // Status can be: PENDING, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

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

    public String getThirdDocumentPath() { return thirdDocumentPath; }
    public void setThirdDocumentPath(String thirdDocumentPath) { this.thirdDocumentPath = thirdDocumentPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}