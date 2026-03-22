package com.project.campus_marketplace.dto;

public class UserManagementDTO {
    private Integer id;
    private String fullName;
    private String email;
    private String role; // "MERCHANT" or "BUYER"
    private String accountStatus; // "ACTIVE" or "SUSPENDED"
    private long listingCount;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }
    public long getListingCount() { return listingCount; }
    public void setListingCount(long listingCount) { this.listingCount = listingCount; }
}