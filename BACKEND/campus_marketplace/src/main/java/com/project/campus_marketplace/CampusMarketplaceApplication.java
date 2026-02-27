package com.project.campus_marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class CampusMarketplaceApplication {

	static void main(String[] args) {
		SpringApplication.run(CampusMarketplaceApplication.class, args);
	}

}
