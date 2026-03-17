package com.project.campus_marketplace.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "sender_id", nullable = false)
    private Integer senderId;

    @Column(name = "receiver_id", nullable = false)
    private Integer receiverId;

    // The single product attachment
    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "is_offer")
    private Boolean isOffer = false;

    @Column(name = "offer_price")
    private Double offerPrice;

    @Column(name = "offer_status")
    private String offerStatus; // e.g., "PENDING", "ACCEPTED", "REJECTED"

    // The 3 allowed file attachments (Images/Docs)
    @Column(name = "attachment_1")
    private String attachment1;

    @Column(name = "attachment_2")
    private String attachment2;

    @Column(name = "attachment_3")
    private String attachment3;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();


    public ChatMessage() {}

    // --- Standard Getters and Setters ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) { this.senderId = senderId; }

    public Integer getReceiverId() { return receiverId; }
    public void setReceiverId(Integer receiverId) { this.receiverId = receiverId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // --- New Attachment Getters and Setters ---
    public String getAttachment1() { return attachment1; }
    public void setAttachment1(String attachment1) { this.attachment1 = attachment1; }

    public String getAttachment2() { return attachment2; }
    public void setAttachment2(String attachment2) { this.attachment2 = attachment2; }

    public String getAttachment3() { return attachment3; }
    public void setAttachment3(String attachment3) { this.attachment3 = attachment3; }

    public Boolean getIsOffer() { return isOffer; }
    public void setIsOffer(Boolean isOffer) { this.isOffer = isOffer; }

    public Double getOfferPrice() { return offerPrice; }
    public void setOfferPrice(Double offerPrice) { this.offerPrice = offerPrice; }

    public String getOfferStatus() { return offerStatus; }
    public void setOfferStatus(String offerStatus) { this.offerStatus = offerStatus; }
}