package com.nangjanggo.yangsim.notification;

import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    public void sendNotification(Long userId, Notification.NotificationType type,
                                 String title, String content,
                                 Long groupId, Notification.RelatedEntityType relatedEntityType,
                                 Long relatedEntityId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setGroupId(groupId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        notificationRepository.save(notification);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isPushEnabled() || user.getPushToken() == null) return;

        boolean shouldSend = switch (type) {
            case EXPIRY_SOON -> user.isExpiryAlertEnabled();
            case CLAIM_SUCCESS, CLAIM_FAILED -> user.isSharedPurchaseAlertEnabled();
            case NOTICE_CREATED -> user.isBoardAlertEnabled();
            case GROUP_KICKED, GROUP_PROMOTED -> true;
            case INSPECTION_DAY, DISCARD_THRESHOLD -> true;
        };

        if (shouldSend) {
            sendExpoPush(user.getPushToken(), title, content, type, groupId, relatedEntityId);
        }
    }

    private void sendExpoPush(String token, String title, String body,
                              Notification.NotificationType type, Long groupId, Long relatedEntityId) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("type", type.name());
            if (groupId != null) data.put("groupId", groupId);
            if (relatedEntityId != null) data.put("relatedEntityId", relatedEntityId);

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", token);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("data", data);
            if (type == Notification.NotificationType.EXPIRY_SOON) {
                payload.put("categoryId", "food_expiry");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForObject(EXPO_PUSH_URL, new HttpEntity<>(payload, headers), String.class);
        } catch (Exception ignored) {
            // 푸시 실패해도 DB 저장은 유지
        }
    }

    public void registerToken(Long userId, String token) {
        getUser(userId).setPushToken(token);
    }

    public void deleteToken(Long userId) {
        getUser(userId).setPushToken(null);
    }

    @Transactional(readOnly = true)
    public NotificationResponseDto.Settings getSettings(Long userId) {
        User user = getUser(userId);
        return new NotificationResponseDto.Settings(
                user.isPushEnabled(),
                user.isExpiryAlertEnabled(),
                user.isSharedPurchaseAlertEnabled(),
                user.isBoardAlertEnabled()
        );
    }

    public void updateSettings(Long userId, NotificationRequestDto.UpdateSettings dto) {
        User user = getUser(userId);
        if (dto.getPushEnabled() != null) user.setPushEnabled(dto.getPushEnabled());
        if (dto.getExpiryAlertEnabled() != null) user.setExpiryAlertEnabled(dto.getExpiryAlertEnabled());
        if (dto.getSharedPurchaseAlertEnabled() != null) user.setSharedPurchaseAlertEnabled(dto.getSharedPurchaseAlertEnabled());
        if (dto.getBoardAlertEnabled() != null) user.setBoardAlertEnabled(dto.getBoardAlertEnabled());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDto.NotificationInfo> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponseDto.NotificationInfo(
                        n.getId(), n.getType(), n.getTitle(), n.getContent(),
                        n.isRead(), n.getGroupId(), n.getRelatedEntityType(),
                        n.getRelatedEntityId(), n.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NotificationResponseDto.UnreadCount getUnreadCount(Long userId) {
        return new NotificationResponseDto.UnreadCount(notificationRepository.countUnread(userId));
    }

    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
    }

    public void deleteOne(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));
        notificationRepository.delete(notification);
    }

    public void deleteAll(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }
}
