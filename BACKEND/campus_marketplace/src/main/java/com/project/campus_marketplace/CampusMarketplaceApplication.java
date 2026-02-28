package com.project.campus_marketplace;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CampusMarketplaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CampusMarketplaceApplication.class, args);
	}

	// THIS IS THE FIX: It sets the limit to 100MB (104857600 bytes)
	// using raw Jakarta classes, bypassing the missing Spring Factory.
	@Bean
	public MultipartConfigElement multipartConfigElement() {
		return new MultipartConfigElement("", 104857600L, 104857600L, 0);
	}
}