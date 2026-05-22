package com.nangjanggo.yangsim.notification;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    public enum NotificationType {
        GROUP_KICKED, GROUP_PROMOTED, EXPIRY_SOON, NOTICE_CREATED, CLAIM_SUCCESS, CLAIM_FAILED
    }

    public enum RelatedEntityType {
        FOOD_ITEM, POST, GROUP
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Long userId;
    Long groupId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    NotificationType type;

    String title;

    @Column(columnDefinition = "TEXT")
    String content;

    @Enumerated(EnumType.STRING)
    RelatedEntityType relatedEntityType;

    Long relatedEntityId;

    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    boolean isRead = false;

    LocalDateTime createdAt = LocalDateTime.now();

    LocalDateTime readAt;
}
