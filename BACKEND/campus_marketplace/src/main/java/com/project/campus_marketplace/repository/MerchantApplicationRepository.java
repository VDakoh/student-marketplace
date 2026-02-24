package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.MerchantApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantApplicationRepository extends JpaRepository<MerchantApplication, Integer> {

    // To check if a student already has a pending application
    Optional<MerchantApplication> findByStudentIdAndStatus(Integer studentId, String status);

    // For the Admin dashboard to view all pending requests
    List<MerchantApplication> findByStatus(String status);
}