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

import java.util.List;
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

    // ─── sendNotification ────────────────────────────────────────

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

    // ─── registerToken / deleteToken ─────────────────────────────

    // 테스트 8: 푸시 토큰 정상 등록
    @Test
    void registerToken_정상등록() {
        User user = userWith(false, null, true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        notificationService.registerToken(1L, "ExponentPushToken[new]");

        assertThat(user.getPushToken()).isEqualTo("ExponentPushToken[new]");
    }

    // 테스트 9: 푸시 토큰 정상 삭제
    @Test
    void deleteToken_정상삭제() {
        User user = userWith(true, "ExponentPushToken[old]", true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        notificationService.deleteToken(1L);

        assertThat(user.getPushToken()).isNull();
    }

    // ─── getSettings / updateSettings ────────────────────────────

    // 테스트 10: 알림 설정 정상 조회
    @Test
    void getSettings_정상조회() {
        User user = userWith(true, null, true, false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        NotificationResponseDto.Settings settings = notificationService.getSettings(1L);

        assertThat(settings.isPushEnabled()).isTrue();
        assertThat(settings.isExpiryAlertEnabled()).isTrue();
        assertThat(settings.isSharedPurchaseAlertEnabled()).isFalse();
    }

    // 테스트 11: 알림 설정 정상 변경
    @Test
    void updateSettings_정상변경() {
        User user = userWith(true, null, true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        NotificationRequestDto.UpdateSettings dto = mock(NotificationRequestDto.UpdateSettings.class);
        when(dto.getPushEnabled()).thenReturn(false);
        when(dto.getExpiryAlertEnabled()).thenReturn(null);
        when(dto.getSharedPurchaseAlertEnabled()).thenReturn(null);
        when(dto.getBoardAlertEnabled()).thenReturn(null);

        notificationService.updateSettings(1L, dto);

        assertThat(user.isPushEnabled()).isFalse();
        assertThat(user.isExpiryAlertEnabled()).isTrue(); // 변경 없음
    }

    // ─── getNotifications ────────────────────────────────────────

    // 테스트 12: 알림 목록 정상 조회
    @Test
    void getNotifications_정상조회() {
        Notification n = new Notification();
        n.setUserId(1L);
        n.setType(Notification.NotificationType.EXPIRY_SOON);
        n.setTitle("유통기한 임박");
        n.setContent("사과가 내일 만료됩니다");
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));

        List<NotificationResponseDto.NotificationInfo> result = notificationService.getNotifications(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("유통기한 임박");
    }

    // ─── markAsRead ──────────────────────────────────────────────

    // 테스트 13: 알림 읽음 처리 정상 동작
    @Test
    void markAsRead_정상처리() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setUserId(1L);
        notification.setRead(false);
        when(notificationRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(1L, 1L);

        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
    }

    // ─── deleteAll ───────────────────────────────────────────────

    // 테스트 14: 전체 알림 삭제
    @Test
    void deleteAll_정상삭제() {
        notificationService.deleteAll(1L);

        verify(notificationRepository).deleteByUserId(1L);
    }
}
