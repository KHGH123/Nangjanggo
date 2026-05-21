package com.nangjanggo.yangsim.notification;

import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
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
