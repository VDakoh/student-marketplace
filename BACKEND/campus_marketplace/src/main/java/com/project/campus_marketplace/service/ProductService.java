package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.Product;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantProfileRepository;
import com.project.campus_marketplace.repository.ProductRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
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

    @Autowired
    private com.project.campus_marketplace.repository.BannedKeywordRepository bannedKeywordRepository;

    private static final List<String> BANNED_KEYWORDS = List.of(
            "weapon", "gun", "knife", "drugs", "weed", "vape", "exam answers", "fake id", "stolen", "hack", "porn", "sex", "Kush", "gay"
    );

    private void validateContentAgainstPolicies(String... fields) throws Exception {
        // Fetch keywords fresh from the database
        List<String> bannedKeywords = bannedKeywordRepository.findAll().stream()
                .map(k -> k.getWord().toLowerCase())
                .toList();

        if (bannedKeywords.isEmpty()) return; // Skip if admin hasn't set any words

        for (String field : fields) {
            if (field == null || field.trim().isEmpty()) continue;

            String lowerField = field.toLowerCase();
            for (String keyword : bannedKeywords) {
                if (lowerField.contains(keyword)) {
                    throw new Exception("Listing rejected: Contains prohibited content (" + keyword + ").");
                }
            }
        }
    }

    // 1. ADD NEW PRODUCT (Multi-Image Support & SKU Generation)
    public Product addProduct(String email, String title, String description, BigDecimal price,
                              String listingType, String subType, String category, String customCategory,
                              String itemCondition, Integer stockQuantity, List<MultipartFile> images) throws Exception {

        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        validateContentAgainstPolicies(title, description, customCategory);

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
    // 2. UPDATE EXISTING PRODUCT (With Image Deletion Logic)
    public Product updateProduct(Integer id, String email, String title, String description, BigDecimal price,
                                 String listingType, String subType, String category, String customCategory,
                                 String itemCondition, Integer stockQuantity, List<MultipartFile> newImages,
                                 List<String> keptImages) throws Exception { // <-- Add keptImages to signature

        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new Exception("Product not found"));

        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to edit this product");
        }

        // STEP 7.8 AUTO-MODERATOR INJECTION
        validateContentAgainstPolicies(title, description, customCategory);

        product.setTitle(title);
        product.setDescription(description);
        product.setPrice(price);
        product.setListingType(listingType);
        product.setSubType(subType);
        product.setCategory(category);
        product.setCustomCategory("Other...".equals(category) ? customCategory : null);

        if ("ITEM".equalsIgnoreCase(listingType)) {
            product.setItemCondition(itemCondition);
            product.setStockQuantity(stockQuantity);
        } else {
            product.setItemCondition(null);
            product.setStockQuantity(stockQuantity <= 0 ? 0 : 1);
        }

        // --- IMAGE RECONCILIATION LOGIC ---
        List<String> currentPaths = product.getImagePaths() != null ? product.getImagePaths() : new ArrayList<>();
        List<String> updatedPaths = new ArrayList<>();

        // 1. Process existing images (Keep or physically delete)
        if (keptImages != null && !keptImages.isEmpty()) {
            for (String path : currentPaths) {
                if (keptImages.contains(path)) {
                    updatedPaths.add(path); // Keep it
                } else {
                    // Delete removed file from server to save space
                    try { Files.deleteIfExists(Paths.get(path)); }
                    catch (Exception e) { System.out.println("Could not delete image: " + path); }
                }
            }
        } else {
            // If keptImages is null, the user deleted ALL old images
            for (String path : currentPaths) {
                try { Files.deleteIfExists(Paths.get(path)); }
                catch (Exception e) { System.out.println("Could not delete image: " + path); }
            }
        }

        // 2. Upload and append entirely new images
        if (newImages != null && !newImages.isEmpty()) {
            String uploadDir = "uploads/products/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            for (MultipartFile file : newImages) {
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(uploadDir + fileName);
                    Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    updatedPaths.add(uploadDir + fileName);
                }
            }
        }

        // 3. Save new paths back to entity
        product.setImagePaths(updatedPaths);

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

    // --- MERCHANT INVENTORY CONTROLS (STEP 7.5) ---

    // Toggle Status between ACTIVE and DISABLED
    public Product toggleProductStatus(Integer productId, String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));

        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to edit this product");
        }

        if ("DISABLED".equalsIgnoreCase(product.getStatus())) {
            product.setStatus("ACTIVE");
        } else {
            product.setStatus("DISABLED");
        }

        return productRepository.save(product);
    }

    // Quick-action to mark stock to 0
    public Product markOutOfStock(Integer productId, String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));

        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to edit this product");
        }

        product.setStockQuantity(0);
        return productRepository.save(product);
    }

    public Product toggleServiceOffering(Integer productId, String email) throws Exception {
        Student merchant = studentRepository.findByBabcockEmail(email)
                .orElseThrow(() -> new Exception("Merchant not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));

        if (!product.getMerchantId().equals(merchant.getId())) {
            throw new Exception("Unauthorized to edit this product");
        }

        if ("SERVICE".equalsIgnoreCase(product.getListingType())) {
            // If it's currently 0 or null (Not Offering), set it to 1 (Offering)
            if (product.getStockQuantity() == null || product.getStockQuantity() <= 0) {
                product.setStockQuantity(1);
            } else {
                // If it's > 0 (Offering), set it to 0 (Not Offering)
                product.setStockQuantity(0);
            }
        }
        return productRepository.save(product);
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

    // --- GLOBAL STATUS ENFORCEMENT: SECURE PUBLIC FEED ---
    public List<com.project.campus_marketplace.model.Product> getPublicMarketplaceProducts() {
        // 1. Get a list of IDs for merchants who are ACTIVE
        List<Integer> activeMerchantIds = merchantProfileRepository.findByStoreStatus("ACTIVE")
                .stream()
                .map(com.project.campus_marketplace.model.MerchantProfile::getStudentId)
                .toList();

        // 2. Fetch all products, but strictly filter out invalid ones
        return productRepository.findAll().stream()
                .filter(p -> !"DISABLED".equals(p.getStatus())) // Hide DISABLED completely
                .filter(p -> activeMerchantIds.contains(p.getMerchantId())) // Hide if Merchant is PAUSED/VACATION
                .toList();
    }
}