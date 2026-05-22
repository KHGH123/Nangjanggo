package com.nangjanggo.yangsim.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

public class NotificationResponseDto {

    @Getter
    @AllArgsConstructor
    public static class NotificationInfo {
        private Long id;
        private Notification.NotificationType type;
        private String title;
        private String content;
        @JsonProperty("isRead")
        private boolean isRead;
        private Long groupId;
        private Notification.RelatedEntityType relatedEntityType;
        private Long relatedEntityId;
        private LocalDateTime createdAt;
    }

    @Getter
    @AllArgsConstructor
    public static class Settings {
        private boolean pushEnabled;
        private boolean expiryAlertEnabled;
        private boolean sharedPurchaseAlertEnabled;
        private boolean boardAlertEnabled;
    }

    @Getter
    @AllArgsConstructor
    public static class UnreadCount {
        private long count;
    }
}
