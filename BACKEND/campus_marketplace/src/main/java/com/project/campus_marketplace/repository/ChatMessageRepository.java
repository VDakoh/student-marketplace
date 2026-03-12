package com.project.campus_marketplace.repository;

import com.project.campus_marketplace.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    // Fetches the exact conversation history between two users, ordered chronologically
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);

    // Fetches all messages for a specific user to build their Inbox list
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.receiverId = :userId ORDER BY m.timestamp DESC")
    List<ChatMessage> findAllUserMessages(@Param("userId") Integer userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiverId = :userId AND m.isRead = false")
    Long countUnreadMessagesForUser(@Param("userId") Integer userId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    void markMessagesAsRead(@Param("senderId") Integer senderId, @Param("receiverId") Integer receiverId);
}