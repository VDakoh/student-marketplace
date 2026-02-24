package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Admin;
import com.project.campus_marketplace.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String password = payload.get("password");

        String result = authService.registerStudent(email, fullName, password);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // --- NEW LOGIN ENDPOINT ---
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        String result = authService.loginStudent(email, password);

        if (result.startsWith("Error")) {
            return ResponseEntity.badRequest().body(result);
        }

        // Returns the JWT Token to the frontend!
        return ResponseEntity.ok(result);
    }

    // ... [Keep your existing student endpoints] ...

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