package com.project.campus_marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    // Stores OTPs temporarily in memory. Key = Email, Value = OTP Data
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    public void generateAndSendOtp(String email) throws Exception {
        // 1. Generate a random 6-digit number
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 2. Save it to memory with a 5-minute expiration timer
        otpStorage.put(email, new OtpData(otp, LocalDateTime.now().plusMinutes(5)));

        // 3. Draft and send the email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("babcockmarketplace@gmail.com"); // Will be overridden by your properties file
        message.setTo(email);
        message.setSubject("Babcock Marketplace - Verification Code");
        message.setText("Welcome to Babcock Marketplace!\n\n"
                + "Your 6-digit registration verification code is: " + otp + "\n\n"
                + "This code will expire in 5 minutes.\n"
                + "If you did not request this code, please ignore this email.");

        mailSender.send(message);
    }

    public boolean validateOtp(String email, String userProvidedOtp) {
        OtpData data = otpStorage.get(email);

        // If no OTP was generated for this email
        if (data == null) return false;

        // If the 5 minutes have passed
        if (LocalDateTime.now().isAfter(data.expiryTime)) {
            otpStorage.remove(email);
            return false;
        }

        // If the codes match, approve and delete the OTP (single-use)
        if (data.otp.equals(userProvidedOtp)) {
            otpStorage.remove(email);
            return true;
        }

        return false;
    }

    // Helper class to hold the code and its expiration time
    private static class OtpData {
        String otp;
        LocalDateTime expiryTime;

        OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}