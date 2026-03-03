package com.project.campus_marketplace.config;

import com.project.campus_marketplace.model.Admin;
import com.project.campus_marketplace.repository.AdminRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedDatabase(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check if the master admin already exists to prevent duplicate creation
            if (adminRepository.findByEmail("moderator@gmail.com").isEmpty()) {

                Admin masterAdmin = new Admin();
                masterAdmin.setFullName("Platform Moderator");
                masterAdmin.setEmail("moderator@gmail.com"); // Can be any email
                // Securely encrypt the password before saving
                masterAdmin.setPassword(passwordEncoder.encode("admin123"));
                masterAdmin.setRole("ADMIN");

                adminRepository.save(masterAdmin);
                System.out.println("✅ Master Admin account successfully generated.");
            }

            if (adminRepository.findByEmail("victor@babcock.edu.ng").isEmpty()) {
                Admin secondAdmin = new Admin();
                secondAdmin.setFullName("Victor - Super Admin");
                secondAdmin.setEmail("victor@babcock.edu.ng"); // Change to desired email
                secondAdmin.setPassword(passwordEncoder.encode("admin123")); // Change to desired password
                secondAdmin.setRole("ADMIN");

                adminRepository.save(secondAdmin);
                System.out.println("✅ Victor's Admin account successfully generated.");
            }
        };
    }
}