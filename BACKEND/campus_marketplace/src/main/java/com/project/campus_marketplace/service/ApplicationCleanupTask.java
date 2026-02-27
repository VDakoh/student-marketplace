package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.MerchantApplication;
import com.project.campus_marketplace.repository.MerchantApplicationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationCleanupTask {

    private final MerchantApplicationRepository appRepository;

    public ApplicationCleanupTask(MerchantApplicationRepository appRepository) {
        this.appRepository = appRepository;
    }

    // This cron expression tells Spring to run this exact method every day at Midnight (00:00:00)
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldApplications() {
        System.out.println("🧹 Running automated cleanup of old merchant applications...");

        // 1. Delete APPROVED applications older than 3 days
        LocalDateTime approvedCutoff = LocalDateTime.now().minusDays(3);
        List<MerchantApplication> oldApproved = appRepository.findByStatusAndUpdatedAtBefore("APPROVED", approvedCutoff);
        appRepository.deleteAll(oldApproved);

        // 2. Delete REJECTED applications older than 7 days
        LocalDateTime rejectedCutoff = LocalDateTime.now().minusDays(7);
        List<MerchantApplication> oldRejected = appRepository.findByStatusAndUpdatedAtBefore("REJECTED", rejectedCutoff);
        appRepository.deleteAll(oldRejected);

        System.out.println("✅ Cleanup complete. Deleted " + oldApproved.size() + " approved and " + oldRejected.size() + " rejected applications.");
    }
}