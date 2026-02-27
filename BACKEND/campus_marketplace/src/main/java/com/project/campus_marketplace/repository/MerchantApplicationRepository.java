package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.MerchantApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantApplicationRepository extends JpaRepository<MerchantApplication, Integer> {

    // Fetch by status (PENDING, APPROVED, REJECTED)
    List<MerchantApplication> findByStatus(String status);

    // Check if a user currently has a pending application
    Optional<MerchantApplication> findByStudentIdAndStatus(Integer studentId, String status);

    // Fetch ALL applications for a specific user (History tracking)
    List<MerchantApplication> findByStudentIdOrderByCreatedAtDesc(Integer studentId);

    // Count how many times a user has applied
    long countByStudentId(Integer studentId);

    // For the automated cleanup: Find applications older than a certain date with a specific status
    List<MerchantApplication> findByStatusAndUpdatedAtBefore(String status, LocalDateTime cutoffDate);
}