package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Product;
import com.project.campus_marketplace.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductService productService;

    // POST /api/products : Add a new product (Updated for Taxonomy)
    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestParam("email") String email,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("price") BigDecimal price,
            @RequestParam("listingType") String listingType,
            @RequestParam("subType") String subType,
            @RequestParam("category") String category,
            @RequestParam(value = "customCategory", required = false) String customCategory,
            @RequestParam(value = "itemCondition", required = false) String itemCondition,
            @RequestParam(value = "stockQuantity", required = false) Integer stockQuantity,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Product newProduct = productService.addProduct(
                    email, title, description, price, listingType, subType, category,
                    customCategory, itemCondition, stockQuantity, image);
            return ResponseEntity.ok(newProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating product: " + e.getMessage());
        }
    }

    // GET /api/products/merchant : Get products for the logged-in merchant
    @GetMapping("/merchant")
    public ResponseEntity<?> getMerchantProducts(@RequestParam("email") String email) {
        try {
            List<Product> products = productService.getMerchantProducts(email);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching products.");
        }
    }

    // GET /api/products : Get all active products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }
}