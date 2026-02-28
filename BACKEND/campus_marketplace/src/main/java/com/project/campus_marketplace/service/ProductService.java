package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.Product;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.ProductRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StudentRepository studentRepository;

    // 1. ADD A NEW PRODUCT (Updated with Taxonomy Engine)
    public Product addProduct(String email, String title, String description, BigDecimal price,
                              String listingType, String subType, String category, String customCategory,
                              String itemCondition, Integer stockQuantity, MultipartFile imageFile) throws Exception {

        // Using the correct Babcock lookup method!
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = new Product();
        product.setMerchantId(merchant.getId());
        product.setTitle(title);
        product.setDescription(description);
        product.setPrice(price);

        // Injecting the new taxonomy fields
        product.setListingType(listingType);
        product.setSubType(subType);
        product.setCategory(category);
        product.setCustomCategory(customCategory);

        // These can gracefully be null if the listingType is "SERVICE"
        product.setItemCondition(itemCondition);
        product.setStockQuantity(stockQuantity);

        // Handle Image Upload if provided
        if (imageFile != null && !imageFile.isEmpty()) {
            String uploadDir = "uploads/products/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID().toString() + "_" + imageFile.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            product.setImagePath(uploadDir + fileName);
        }

        return productRepository.save(product);
    }

    // 2. GET ALL PRODUCTS FOR A SPECIFIC MERCHANT
    public List<Product> getMerchantProducts(String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        return productRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
    }

    // 3. GET ALL ACTIVE PRODUCTS (For the main marketplace feed)
    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }
}