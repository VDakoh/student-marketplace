package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // For the buyer's "Active Requests" tab
    List<Order> findByBuyerIdOrderByCreatedAtDesc(Integer buyerId);

    // For the merchant's fulfillment tab
    List<Order> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);
}