package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.BannedKeyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BannedKeywordRepository extends JpaRepository<BannedKeyword, Integer> {
    boolean existsByWordIgnoreCase(String word);
}