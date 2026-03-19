package com.project.campus_marketplace.service;

import com.project.campus_marketplace.model.Notification;
import com.project.campus_marketplace.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotification(Integer recipientId, String title, String message, String type, String actionUrl) {
        // 1. Save to Database
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setActionUrl(actionUrl);

        Notification savedNotification = notificationRepository.save(notification);

        // 2. Fire WebSocket to the specific user on a dedicated notification channel
        messagingTemplate.convertAndSendToUser(
                String.valueOf(recipientId),
                "/queue/notifications", // DEDICATED CHANNEL!
                savedNotification
        );
    }
}