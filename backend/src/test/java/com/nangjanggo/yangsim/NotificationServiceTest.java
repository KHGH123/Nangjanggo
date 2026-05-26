package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.notification.*;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;
    @Mock RestTemplate restTemplate;

    @InjectMocks NotificationService notificationService;

    private User userWith(boolean pushEnabled, String pushToken, boolean expiryAlert, boolean sharedAlert) {
        User u = new User();
        u.setId(1L);
        u.setPushEnabled(pushEnabled);
        u.setPushToken(pushToken);
        u.setExpiryAlertEnabled(expiryAlert);
        u.setSharedPurchaseAlertEnabled(sharedAlert);
        u.setBoardAlertEnabled(true);
        return u;
    }

    // 테스트 1: 푸시 토큰 없어도 항상 DB에 저장됨
    @Test
    void sendNotification_토큰없어도_DB에_저장됨() {
        User user = userWith(true, null, true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenReturn(new Notification());

        notificationService.sendNotification(
                1L, Notification.NotificationType.EXPIRY_SOON,
                "제목", "내용", 1L, Notification.RelatedEntityType.FOOD_ITEM, 10L);

        verify(notificationRepository).save(any(Notification.class));
        verifyNoInteractions(restTemplate);
    }

    // 테스트 2: pushEnabled=false이면 푸시 미전송 (DB는 저장)
    @Test
    void sendNotification_pushEnabled_false이면_푸시안보냄() {
        User user = userWith(false, "ExponentPushToken[xxx]", true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenReturn(new Notification());

        notificationService.sendNotification(
                1L, Notification.NotificationType.EXPIRY_SOON,
                "제목", "내용", 1L, Notification.RelatedEntityType.FOOD_ITEM, 10L);

        verify(notificationRepository).save(any());
        verifyNoInteractions(restTemplate);
    }

    // 테스트 3: expiryAlertEnabled=false이면 EXPIRY_SOON 푸시 미전송
    @Test
    void sendNotification_expiryAlert_disabled이면_푸시안보냄() {
        User user = userWith(true, "ExponentPushToken[xxx]", false, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenReturn(new Notification());

        notificationService.sendNotification(
                1L, Notification.NotificationType.EXPIRY_SOON,
                "제목", "내용", 1L, Notification.RelatedEntityType.FOOD_ITEM, 10L);

        verifyNoInteractions(restTemplate);
    }

    // 테스트 4: 모든 조건 충족 시 Expo API 호출됨
    @Test
    void sendNotification_조건충족시_Expo_API_호출() {
        User user = userWith(true, "ExponentPushToken[abc]", true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenReturn(new Notification());

        notificationService.sendNotification(
                1L, Notification.NotificationType.EXPIRY_SOON,
                "유통기한 임박", "사과 내일까지", 1L,
                Notification.RelatedEntityType.FOOD_ITEM, 10L);

        verify(restTemplate).postForObject(
                eq("https://exp.host/--/api/v2/push/send"),
                any(), eq(String.class));
    }

    // 테스트 5: sharedPurchaseAlert=false이면 CLAIM_SUCCESS 푸시 미전송
    @Test
    void sendNotification_sharedAlert_disabled이면_CLAIM_SUCCESS_푸시안보냄() {
        User user = userWith(true, "ExponentPushToken[abc]", true, false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenReturn(new Notification());

        notificationService.sendNotification(
                1L, Notification.NotificationType.CLAIM_SUCCESS,
                "찜 성공", "바나나가 내 냉장고로 이동", 1L,
                Notification.RelatedEntityType.FOOD_ITEM, 5L);

        verifyNoInteractions(restTemplate);
    }

    // 테스트 6: 본인 알림이 아닌 것 읽음처리 시 예외
    @Test
    void markAsRead_본인알림아니면_예외() {
        when(notificationRepository.findByIdAndUserId(99L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(1L, 99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("알림을 찾을 수 없습니다.");
    }

    // 테스트 7: 본인 알림이 아닌 것 삭제 시 예외
    @Test
    void deleteOne_본인알림아니면_예외() {
        when(notificationRepository.findByIdAndUserId(99L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.deleteOne(1L, 99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("알림을 찾을 수 없습니다.");
    }
}
