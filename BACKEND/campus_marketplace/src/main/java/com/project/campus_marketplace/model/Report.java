package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer reporterId; // The student who submitted the report

    private Integer reportedProductId; // The listing being reported

    private String type; // e.g., "PROHIBITED_ITEM", "SCAM", "OFFENSIVE"

    @Column(columnDefinition = "TEXT")
    private String reason; // Detailed explanation from the user

    private String status; // "PENDING", "RESOLVED", "DISMISSED"

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getReporterId() { return reporterId; }
    public void setReporterId(Integer reporterId) { this.reporterId = reporterId; }

    public Integer getReportedProductId() { return reportedProductId; }
    public void setReportedProductId(Integer reportedProductId) { this.reportedProductId = reportedProductId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}