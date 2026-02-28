package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    // Find all products owned by a specific merchant (Used for their dashboard)
    List<Product> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);

    // Find all active products across the whole platform (Used for the main homepage feed)
    List<Product> findByStatusOrderByCreatedAtDesc(String status);

    // Find active products by category
    List<Product> findByStatusAndCategoryOrderByCreatedAtDesc(String status, String category);
}