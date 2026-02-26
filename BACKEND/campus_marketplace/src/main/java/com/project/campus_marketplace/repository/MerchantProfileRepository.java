package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.MerchantProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MerchantProfileRepository extends JpaRepository<MerchantProfile, Integer> {
    // We will need this to fetch the profile using the logged-in student's ID
    Optional<MerchantProfile> findByStudentId(Integer studentId);
}