package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.Admin;
import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.AdminRepository;
import com.project.campus_marketplace.repository.StudentRepository;
import com.project.campus_marketplace.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private static final String BABCOCK_DOMAIN = "@student.babcock.edu.ng";

    public AuthService(StudentRepository studentRepository, AdminRepository adminRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String registerStudent(String email, String fullName, String rawPassword) {
        if (email == null || !email.toLowerCase().endsWith(BABCOCK_DOMAIN)) {
            return "Error: Invalid email. Must use a @student.babcock.edu.ng email.";
        }
        if (studentRepository.findByBabcockEmail(email).isPresent()) {
            return "Error: Email already registered.";
        }

        Student newStudent = new Student();
        newStudent.setBabcockEmail(email.toLowerCase());
        newStudent.setFullName(fullName);
        newStudent.setPasswordHash(passwordEncoder.encode(rawPassword));

        studentRepository.save(newStudent);
        return "Success: Student registered successfully!";
    }

    // --- NEW LOGIN LOGIC ---
    public String loginStudent(String email, String rawPassword) {
        Optional<Student> studentOpt = studentRepository.findByBabcockEmail(email.toLowerCase());

        // Check if user exists
        if (studentOpt.isEmpty()) {
            return "Error: User not found.";
        }

        Student student = studentOpt.get();

        // Check if passwords match
        if (!passwordEncoder.matches(rawPassword, student.getPasswordHash())) {
            return "Error: Invalid password.";
        }

        return jwtUtil.generateToken(student.getBabcockEmail(), student.getRole(), student.getFullName());
    }

    public String registerAdmin(Admin admin) {
        if (adminRepository.findByEmail(admin.getEmail()).isPresent()) {
            return "Error: Admin email already exists.";
        }

        // Hash the password securely
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));
        admin.setRole("ADMIN"); // Enforce the admin role

        adminRepository.save(admin);
        return "Success: Admin registered successfully.";
    }

    public String loginAdmin(String email, String password) {
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);

        if (adminOpt.isEmpty()) {
            return "Error: Admin not found.";
        }

        Admin admin = adminOpt.get();

        if (!passwordEncoder.matches(password, admin.getPassword())) {
            return "Error: Invalid credentials.";
        }

        // Generate the JWT Token specifically for the Admin!
        return jwtUtil.generateToken(admin.getEmail(), admin.getRole(), admin.getFullName());
    }
}