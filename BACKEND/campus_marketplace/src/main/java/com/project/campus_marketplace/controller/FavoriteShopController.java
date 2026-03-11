package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.FavoriteShop;
import com.project.campus_marketplace.repository.FavoriteShopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteShopController {

    @Autowired
    private FavoriteShopRepository favoriteShopRepository;

    @PostMapping("/toggle")
    @Transactional
    public ResponseEntity<?> toggleFavorite(@RequestBody Map<String, Integer> payload) {
        Integer studentId = payload.get("studentId");
        Integer merchantId = payload.get("merchantId");

        if (studentId == null || merchantId == null) {
            return ResponseEntity.badRequest().body("Missing studentId or merchantId");
        }

        Optional<FavoriteShop> existing = favoriteShopRepository.findByStudentIdAndMerchantId(studentId, merchantId);

        if (existing.isPresent()) {
            favoriteShopRepository.deleteByStudentIdAndMerchantId(studentId, merchantId);
            return ResponseEntity.ok(Map.of("favorited", false, "message", "Shop removed from favorites"));
        } else {
            FavoriteShop newFav = new FavoriteShop(studentId, merchantId);
            favoriteShopRepository.save(newFav);
            return ResponseEntity.ok(Map.of("favorited", true, "message", "Shop added to favorites"));
        }
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<List<FavoriteShop>> getUserFavorites(@PathVariable Integer studentId) {
        return ResponseEntity.ok(favoriteShopRepository.findByStudentIdOrderByFavoritedAtDesc(studentId));
    }
}