package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppealRepository extends JpaRepository<Appeal, Integer> {
    List<Appeal> findByStudentIdOrderByCreatedAtDesc(Integer studentId);
    List<Appeal> findAllByOrderByCreatedAtDesc();
}