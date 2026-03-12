package com.project.campus_marketplace.controller;

import com.project.campus_marketplace.model.Student;
import com.project.campus_marketplace.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Define where to save the profile images
    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/students/";

    // 1. Get Student Profile
    @GetMapping("/{id}")
    public ResponseEntity<?> getStudentProfile(@PathVariable Integer id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setPasswordHash(null); // Never send the hash back to the frontend
            return ResponseEntity.ok(student);
        }
        return ResponseEntity.notFound().build();
    }

    // 2. Update Basic Info
    @PutMapping("/{id}/basic-info")
    public ResponseEntity<?> updateBasicInfo(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();
        if (payload.containsKey("fullName")) student.setFullName(payload.get("fullName"));
        if (payload.containsKey("phoneNumber")) student.setPhoneNumber(payload.get("phoneNumber"));
        if (payload.containsKey("campus")) student.setCampus(payload.get("campus"));
        if (payload.containsKey("primaryLocation")) student.setPrimaryLocation(payload.get("primaryLocation"));

        if (payload.containsKey("specificAddress")) student.setSpecificAddress(payload.get("specificAddress"));
        if (payload.containsKey("additionalDirections")) student.setAdditionalDirections(payload.get("additionalDirections"));

        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }


    // 3. Upload Profile Image
    @PostMapping("/{id}/profile-image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) return ResponseEntity.notFound().build();

        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(UPLOAD_DIR + filename);
            Files.write(filePath, file.getBytes());

            Student student = studentOpt.get();
            student.setProfileImageUrl("uploads/students/" + filename);
            studentRepository.save(student);

            return ResponseEntity.ok(Map.of("message", "Image uploaded", "imageUrl", student.getProfileImageUrl()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload image");
        }
    }

    // 4. Change Password
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) return ResponseEntity.notFound().build();

        Student student = studentOpt.get();
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        // Verify the old password matches the hash in the database
        if (!passwordEncoder.matches(currentPassword, student.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Incorrect current password");
        }

        // Hash and save the new password
        student.setPasswordHash(passwordEncoder.encode(newPassword));
        studentRepository.save(student);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    // 5. Deactivate (Delete) Account
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateAccount(@PathVariable Integer id) {
        if (studentRepository.existsById(id)) {
            studentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Account deactivated"));
        }
        return ResponseEntity.notFound().build();
    }


    @DeleteMapping("/{id}/profile-image")
    public ResponseEntity<?> removeProfileImage(@PathVariable Integer id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setProfileImageUrl(null);
            studentRepository.save(student);
            return ResponseEntity.ok(Map.of("message", "Profile image removed successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}