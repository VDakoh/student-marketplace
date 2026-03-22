package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Admin;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.StudentRepository;
import com.project.campus_marketplace.service.AuthService;
import com.project.campus_marketplace.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private StudentRepository studentRepository;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // --- NEW OTP REQUEST ENDPOINT ---
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        // 1. Enforce the Babcock Email Rule (Students and Staff)
        boolean isStudent = email != null && email.toLowerCase().endsWith("@student.babcock.edu.ng");
        boolean isStaff = email != null && email.toLowerCase().endsWith("@babcock.edu.ng");

        if (!isStudent && !isStaff) {
            return ResponseEntity.badRequest().body("Security Error: Only official Babcock University emails are allowed to register.");
        }

        // 2. Check if the user already has an account
        if (studentRepository.findByBabcockEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("An account with this email already exists.");
        }

        // 3. Send the Email!
        try {
            otpService.generateAndSendOtp(email);
            return ResponseEntity.ok("OTP sent successfully to " + email);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to send verification email. Please try again later.");
        }
    }

    // --- UPDATED REGISTER ENDPOINT ---
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String password = payload.get("password");
        String otp = payload.get("otp"); // The new OTP field sent from React

        // Verify the OTP before creating the account
        if (!otpService.validateOtp(email, otp)) {
            return ResponseEntity.badRequest().body("Error: Invalid or expired Verification Code.");
        }

        // If OTP is valid, proceed with normal registration
        String result = authService.registerStudent(email, fullName, password);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // --- LOGIN ENDPOINT ---
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        // 1. Fetch the user directly from the repository using the email provided
        Student user = studentRepository.findByBabcockEmail(email).orElse(null);

        // 2. Check if the user exists AND if their account status is SUSPENDED
        if (user != null && "SUSPENDED".equals(user.getAccountStatus())) {
            // Return the strict 403 JSON response for the frontend to catch
            String errorJson = String.format(
                    "{\"error\":\"ACCOUNT_SUSPENDED\", \"message\":\"Your account has been suspended.\", \"studentId\":%d}",
                    user.getId()
            );
            return ResponseEntity.status(403).body(errorJson);
        }

        // 3. If they are not suspended, proceed with normal authentication
        String result = authService.loginStudent(email, password);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    // --- ADMIN ENDPOINTS ---
    @PostMapping("/admin/login")
    public ResponseEntity<String> loginAdmin(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        String result = authService.loginAdmin(email, password);
        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result); // This returns the JWT Token!
    }

}