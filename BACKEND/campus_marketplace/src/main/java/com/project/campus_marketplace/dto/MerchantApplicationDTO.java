package com.project.campus_marketplace.dto;

public class MerchantApplicationDTO {
    private Integer id;
    private String studentFullName; // The new field fetched from the Student table
    private String businessName;
    private String whatsappNumber;
    private String bio; // We will use this for "Brief Description"
    private String idCardPath;
    private String beaMembershipPath;
    private String selfieImagePath; // Renamed from thirdDocument
    private String status;
    private String mainProducts;
    private String rejectionReason;
    private String createdAt; // Sending as a string makes it easier for React to display
    private long totalApplicationsByUser;
    private Integer studentId;


    // Getters and Setters for all fields
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getStudentFullName() { return studentFullName; }
    public void setStudentFullName(String studentFullName) { this.studentFullName = studentFullName; }

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
    public void setSelfieImagePath(String selfieImagePath) { this.selfieImagePath = selfieImagePath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMainProducts() { return mainProducts; }
    public void setMainProducts(String mainProducts) { this.mainProducts = mainProducts; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public long getTotalApplicationsByUser() { return totalApplicationsByUser; }
    public void setTotalApplicationsByUser(long totalApplicationsByUser) { this.totalApplicationsByUser = totalApplicationsByUser; }

    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }
}