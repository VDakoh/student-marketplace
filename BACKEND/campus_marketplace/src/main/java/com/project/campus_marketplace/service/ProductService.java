package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.Product;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantProfileRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MerchantProfileRepository merchantProfileRepository;

    // 1. ADD NEW PRODUCT (Multi-Image Support & SKU Generation)
    public Product addProduct(String email, String title, String description, BigDecimal price,
                              String listingType, String subType, String category, String customCategory,
                              String itemCondition, Integer stockQuantity, List<MultipartFile> images) throws Exception {

        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = new Product();
        product.setMerchantId(merchant.getId());
        product.setTitle(title);
        product.setDescription(description);
        product.setPrice(price);
        product.setListingType(listingType);
        product.setSubType(subType);
        product.setCategory(category);
        product.setCustomCategory(customCategory);
        product.setItemCondition(itemCondition);
        product.setStockQuantity(stockQuantity);

        // Handle Array of Images
        if (images != null && !images.isEmpty()) {
            List<String> savedImagePaths = new ArrayList<>();
            String uploadDir = "uploads/products/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            for (MultipartFile img : images) {
                if (!img.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + img.getOriginalFilename();
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(img.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    savedImagePaths.add(uploadDir + fileName);
                }
            }
            product.setImagePaths(savedImagePaths);
        }

        // --- SKU GENERATION LOGIC ---
        // 1. Save first to generate the database ID
        Product savedProduct = productRepository.save(product);

        // 2. Fetch the merchant's shop name
        String shopName = merchantProfileRepository.findByStudentId(merchant.getId())
                .map(profile -> profile.getBusinessName())
                .orElse("Shop");

        // 3. Generate the SKU components
        String prefix = generateShopPrefix(shopName);
        String typeCode = listingType.equalsIgnoreCase("ITEM") ? "IT" : "SV";
        String catCode = generateCategoryInitials(category);

        // 4. Format: DERGAD-IT-EG-5
        String finalSku = prefix + "-" + typeCode + "-" + catCode + "-" + savedProduct.getId();

        // 5. Update and save again
        savedProduct.setSku(finalSku);
        return productRepository.save(savedProduct);
    }

    // 2. EDIT EXISTING PRODUCT
    public Product updateProduct(Integer productId, String email, String title, String description, BigDecimal price,
                                 String listingType, String subType, String category, String customCategory,
                                 String itemCondition, Integer stockQuantity, List<MultipartFile> newImages) throws Exception {

        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));

        // Security Check: Only the owner can edit this product
        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to edit this product");
        }

        // Update Fields
        product.setTitle(title);
        product.setDescription(description);
        product.setPrice(price);
        product.setListingType(listingType);
        product.setSubType(subType);
        product.setCategory(category);
        product.setCustomCategory(customCategory);
        product.setItemCondition(itemCondition);
        product.setStockQuantity(stockQuantity);

        // Append new images if provided
        if (newImages != null && !newImages.isEmpty()) {
            String uploadDir = "uploads/products/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            List<String> currentPaths = product.getImagePaths();
            for (MultipartFile img : newImages) {
                if (!img.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + img.getOriginalFilename();
                    Path filePath = uploadPath.resolve(fileName);
                    Files.copy(img.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    currentPaths.add(uploadDir + fileName);
                }
            }
            product.setImagePaths(currentPaths);
        }

        return productRepository.save(product);
    }

    // 3. DELETE PRODUCT
    public void deleteProduct(Integer productId, String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));

        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to delete this product");
        }

        productRepository.delete(product);
    }

    // GET METHODS
    public List<Product> getMerchantProducts(String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));
        return productRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    // --- HELPER METHODS FOR SKU GENERATION ---

    // The 6-Character Shop Prefix Algorithm
    private String generateShopPrefix(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) return "SHOPXX";
        String[] words = shopName.trim().split("\\s+");

        if (words.length == 1) {
            return (words[0].length() >= 6 ? words[0].substring(0, 6) : words[0]).toUpperCase();
        } else if (words.length == 2) {
            return (getSafeSubstring(words[0], 3) + getSafeSubstring(words[1], 3)).toUpperCase();
        } else if (words.length == 3) {
            return (getSafeSubstring(words[0], 2) + getSafeSubstring(words[1], 2) + getSafeSubstring(words[2], 2)).toUpperCase();
        } else {
            return (getSafeSubstring(words[0], 3) + getSafeSubstring(words[words.length - 1], 3)).toUpperCase();
        }
    }

    private String getSafeSubstring(String str, int len) {
        return str.length() >= len ? str.substring(0, len) : str;
    }

    // Category Initials Algorithm (e.g. "Phones & Tablets" -> "PT")
    private String generateCategoryInitials(String category) {
        if (category == null || category.equalsIgnoreCase("Other...")) return "OT";
        StringBuilder initials = new StringBuilder();
        for (String word : category.replaceAll("[^a-zA-Z\\s]", "").split("\\s+")) {
            if (!word.isEmpty() && !word.equalsIgnoreCase("and")) {
                initials.append(word.charAt(0));
            }
        }
        return initials.toString().toUpperCase();
    }
}