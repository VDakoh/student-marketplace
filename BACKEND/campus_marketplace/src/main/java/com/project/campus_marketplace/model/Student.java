package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "babcock_email", unique = true, nullable = false)
    private String babcockEmail;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role = "BUYER"; // Default role for all new registrations

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "campus")
    private String campus;

    @Column(name = "primary_location")
    private String primaryLocation;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "specific_address")
    private String specificAddress;

    @Column(name = "additional_directions")
    private String additionalDirections;

    // --- ACCOUNT STATUS ENGINE ---
    @Column(name = "account_status", nullable = false, columnDefinition = "varchar(255) default 'ACTIVE'")
    private String accountStatus = "ACTIVE";

    // --- ADMIN DASHBOARD HELPERS ---
    // @Transient means "send this to React, but DO NOT save it in the database"
    @Transient
    private Long listingCount = 0L;




    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getBabcockEmail() { return babcockEmail; }
    public void setBabcockEmail(String babcockEmail) { this.babcockEmail = babcockEmail; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getCampus() { return campus; }
    public void setCampus(String campus) { this.campus = campus; }

    public String getPrimaryLocation() { return primaryLocation; }
    public void setPrimaryLocation(String primaryLocation) { this.primaryLocation = primaryLocation; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getSpecificAddress() { return specificAddress; }
    public void setSpecificAddress(String specificAddress) { this.specificAddress = specificAddress; }

    public String getAdditionalDirections() { return additionalDirections; }
    public void setAdditionalDirections(String additionalDirections) { this.additionalDirections = additionalDirections; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public Long getListingCount() { return listingCount; }
    public void setListingCount(Long listingCount) { this.listingCount = listingCount; }
}