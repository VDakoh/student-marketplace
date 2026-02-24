package com.project.campus_marketplace.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // A secure key generated for signing the tokens
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // Token is valid for 24 hours
    private final long EXPIRATION_TIME = 86400000;

    // Notice we added fullName here!
    public String generateToken(String email, String role, String fullName) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("name", fullName) // Packing the name into the token!
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }
}