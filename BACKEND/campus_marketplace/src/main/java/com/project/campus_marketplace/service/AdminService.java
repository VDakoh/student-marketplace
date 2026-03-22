package com.project.campus_marketplace.service;

import com.project.campus_marketplace.dto.MerchantApplicationDTO;
import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.MerchantApplicationRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    @Autowired
    private com.project.campus_marketplace.service.NotificationService notificationService;
    private final MerchantApplicationRepository appRepository;
    private final StudentRepository studentRepository;

    @Autowired
    private com.project.campus_marketplace.repository.ProductRepository productRepository;

    @Autowired
    private com.project.campus_marketplace.repository.OrderRepository orderRepository;

    public AdminService(MerchantApplicationRepository appRepository, StudentRepository studentRepository) {
        this.appRepository = appRepository;
        this.studentRepository = studentRepository;
    }

    // Notice the return type is now List<MerchantApplicationDTO>
    public List<MerchantApplicationDTO> getApplicationsByStatus(String status) {
        List<MerchantApplication> apps = appRepository.findByStatus(status.toUpperCase());

        return apps.stream().map(app -> {
            MerchantApplicationDTO dto = new MerchantApplicationDTO();
            dto.setId(app.getId());
            dto.setBusinessName(app.getBusinessName());
            dto.setMainProducts(app.getMainProducts());
            dto.setWhatsappNumber(app.getWhatsappNumber());
            dto.setBio(app.getBio());
            dto.setIdCardPath(app.getIdCardPath());
            dto.setBeaMembershipPath(app.getBeaMembershipPath());
            dto.setSelfieImagePath(app.getSelfieImagePath());
            dto.setStatus(app.getStatus());
            dto.setStudentId(app.getStudentId());

            // New Fields
            dto.setRejectionReason(app.getRejectionReason());
            dto.setCreatedAt(app.getCreatedAt().toString());

            // Fetch student name and their total application count
            studentRepository.findById(app.getStudentId()).ifPresent(student -> {
                dto.setStudentFullName(student.getFullName());
                dto.setTotalApplicationsByUser(appRepository.countByStudentId(student.getId()));
            });

            return dto;
        }).toList();
    }

    public String approveApplication(Integer applicationId) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        // We ONLY update the application status now. The user upgrades themselves later.
        app.setStatus("APPROVED");
        appRepository.save(app);

        notificationService.sendNotification(
                app.getStudentId(),
                "Application Approved! 🎉",
                "Congratulations! Your merchant application has been approved. You can now access your dashboard and list products.",
                "MERCHANT_APPROVAL",
                "/profile?tab=merchant"
        );

        return "Success: Application approved. User notified to complete setup.";
    }

    public String rejectApplication(Integer applicationId, String reason) {
        MerchantApplication app = appRepository.findById(applicationId).orElse(null);
        if (app == null) return "Error: Application not found.";

        app.setStatus("REJECTED");
        app.setRejectionReason(reason); // Save the admin's specific reason
        appRepository.save(app);

        notificationService.sendNotification(
                app.getStudentId(),
                "Application Update",
                "Unfortunately, your merchant application was declined at this time. Reason: " + reason,
                "ALERT",
                "/profile?tab=merchant"
        );
        return "Success: Application rejected.";
    }

    public List<MerchantApplicationDTO> getStudentApplicationHistory(Integer studentId) {
        List<MerchantApplication> history = appRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        return history.stream().map(app -> {
            MerchantApplicationDTO dto = new MerchantApplicationDTO();
            dto.setId(app.getId());
            dto.setStatus(app.getStatus());
            dto.setMainProducts(app.getMainProducts());
            dto.setRejectionReason(app.getRejectionReason());
            dto.setCreatedAt(app.getCreatedAt().toString());
            return dto;
        }).toList();
    }

    // --- 1. DASHBOARD ANALYTICS ---
    public Map<String, Object> getSystemStatistics() {
        long totalUsers = studentRepository.count();
        long activeUsers = studentRepository.countByAccountStatus("ACTIVE");
        long suspendedUsers = studentRepository.countByAccountStatus("SUSPENDED");
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();

        return Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "suspendedUsers", suspendedUsers,
                "totalProducts", totalProducts,
                "totalOrders", totalOrders
        );
    }

    // --- 2. USER MANAGEMENT ---
    public List<Student> getAllUsers() {
        List<Student> allStudents = studentRepository.findAll();

        // Loop through every user and attach their active listing count!
        for (Student student : allStudents) {
            long count = productRepository.countByMerchantId(student.getId());
            student.setListingCount(count);

            // Security Best Practice: Blank out the password hash before sending to the Admin UI
            student.setPasswordHash(null);
        }

        return allStudents;
    }

    public String toggleUserSuspension(Integer userId) {
        com.project.campus_marketplace.model.Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) return "Error: User not found.";

        if ("SUSPENDED".equals(student.getAccountStatus())) {
            student.setAccountStatus("ACTIVE");
        } else {
            student.setAccountStatus("SUSPENDED");
        }
        studentRepository.save(student);
        return "Success: User account status updated to " + student.getAccountStatus();
    }

    // --- 3. PRODUCT MANAGEMENT ---
    public List<com.project.campus_marketplace.model.Product> getAllProducts() {
        return productRepository.findAll();
    }

    public String deleteProduct(Integer productId) {
        if (!productRepository.existsById(productId)) {
            return "Error: Product not found.";
        }
        productRepository.deleteById(productId);
        return "Success: Product successfully removed from the marketplace.";
    }
}