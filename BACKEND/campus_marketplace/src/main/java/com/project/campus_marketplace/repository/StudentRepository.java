package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {
    // This custom method lets us check if an email is already registered
    Optional<Student> findByBabcockEmail(String email);
}