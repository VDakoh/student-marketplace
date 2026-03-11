package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.FavoriteShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteShopRepository extends JpaRepository<FavoriteShop, Integer> {
    List<FavoriteShop> findByStudentIdOrderByFavoritedAtDesc(Integer studentId);
    Optional<FavoriteShop> findByStudentIdAndMerchantId(Integer studentId, Integer merchantId);
    void deleteByStudentIdAndMerchantId(Integer studentId, Integer merchantId);
}