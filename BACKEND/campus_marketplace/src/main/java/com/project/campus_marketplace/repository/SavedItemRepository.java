package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.SavedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedItemRepository extends JpaRepository<SavedItem, Integer> {
    List<SavedItem> findByStudentIdOrderBySavedAtDesc(Integer studentId);
    Optional<SavedItem> findByStudentIdAndProductId(Integer studentId, Integer productId);
    void deleteByStudentIdAndProductId(Integer studentId, Integer productId);
}