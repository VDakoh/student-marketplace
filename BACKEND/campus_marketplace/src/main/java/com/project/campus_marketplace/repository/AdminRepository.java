package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Integer> {

    // We will need this to find the admin when they try to log in
    Optional<Admin> findByEmail(String email);
}