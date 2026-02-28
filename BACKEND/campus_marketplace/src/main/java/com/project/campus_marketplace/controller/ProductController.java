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

    // POST /api/products : Add a new product
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
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            Product newProduct = productService.addProduct(
                    email, title, description, price, listingType, subType, category,
                    customCategory, itemCondition, stockQuantity, images);
            return ResponseEntity.ok(newProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating product: " + e.getMessage());
        }
    }

    // PUT /api/products/{id} : Edit an existing product
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Integer id,
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
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            Product updatedProduct = productService.updateProduct(
                    id, email, title, description, price, listingType, subType, category,
                    customCategory, itemCondition, stockQuantity, images);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating product: " + e.getMessage());
        }
    }

    // DELETE /api/products/{id} : Delete a product
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Integer id,
            @RequestParam("email") String email) {
        try {
            productService.deleteProduct(id, email);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting product: " + e.getMessage());
        }
    }

    @GetMapping("/merchant")
    public ResponseEntity<?> getMerchantProducts(@RequestParam("email") String email) {
        try {
            return ResponseEntity.ok(productService.getMerchantProducts(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching products.");
        }
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }
}