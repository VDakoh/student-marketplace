package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    // Get all orders where the user is the BUYER
    List<Order> findByBuyerIdOrderByUpdatedAtDesc(Integer buyerId);

    // Get all orders where the user is the SELLER (Merchant)
    List<Order> findByMerchantIdOrderByUpdatedAtDesc(Integer merchantId);
}