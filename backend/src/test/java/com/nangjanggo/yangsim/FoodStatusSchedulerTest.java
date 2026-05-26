package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.food.FoodStatusScheduler;
import com.nangjanggo.yangsim.notification.Notification;
import com.nangjanggo.yangsim.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodStatusSchedulerTest {

    @Mock FoodRepository foodRepository;
    @Mock NotificationService notificationService;

    @InjectMocks FoodStatusScheduler scheduler;

    private Food privateFood(Long id, Long userId, Long groupId, String name) {
        Food f = new Food();
        f.setId(id);
        f.setUserId(userId);
        f.setGroupId(groupId);
        f.setName(name);
        f.setStatus(Food.STATUS.PRIVATE);
        f.setExpirationDate(LocalDateTime.now().plusDays(1));
        return f;
    }

    // 테스트 1: 내일 만료 음식 → CANDIDATE 전환 + EXPIRY_SOON 알림
    @Test
    void updateFoodStatuses_내일만료_CANDIDATE전환_알림전송() {
        Food food = privateFood(1L, 100L, 10L, "사과");

        when(foodRepository.findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
                any(), any(), any()))
                .thenReturn(List.of(food));
        when(foodRepository.findByStatusInAndExpirationDateBefore(any(), any()))
                .thenReturn(List.of());

        scheduler.updateFoodStatuses();

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CANDIDATE);
        verify(notificationService).sendNotification(
                eq(100L),
                eq(Notification.NotificationType.EXPIRY_SOON),
                any(), contains("사과"), eq(10L),
                eq(Notification.RelatedEntityType.FOOD_ITEM), eq(1L)
        );
    }

    // 테스트 2: 찜한 사람 있는 CANDIDATE 만료 → 소유권 이전 + CLAIM_SUCCESS 알림
    @Test
    void updateFoodStatuses_찜한사람있으면_소유권이전_CLAIM_SUCCESS알림() {
        Food food = new Food();
        food.setId(2L);
        food.setUserId(100L);
        food.setGroupId(10L);
        food.setName("바나나");
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setClaimedByUserId(200L);
        food.setExpirationDate(LocalDateTime.now().minusDays(1));

        when(foodRepository.findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
                any(), any(), any()))
                .thenReturn(List.of());
        // 첫 번째 호출(CANDIDATE 만료): food 반환 / 두 번째 호출(PRIVATE+SHARED 만료): 빈 리스트
        when(foodRepository.findByStatusInAndExpirationDateBefore(any(), any()))
                .thenReturn(List.of(food))
                .thenReturn(List.of());

        scheduler.updateFoodStatuses();

        assertThat(food.getUserId()).isEqualTo(200L);
        assertThat(food.getClaimedByUserId()).isNull();
        assertThat(food.getStatus()).isEqualTo(Food.STATUS.PRIVATE);
        assertThat(food.isClaimed()).isTrue();
        verify(notificationService).sendNotification(
                eq(200L),
                eq(Notification.NotificationType.CLAIM_SUCCESS),
                any(), any(), eq(10L), any(), eq(2L)
        );
    }

    // 테스트 3: 찜한 사람 없는 CANDIDATE 만료 → SHARED 전환 + CLAIM_FAILED 알림
    @Test
    void updateFoodStatuses_찜없으면_SHARED전환_CLAIM_FAILED알림() {
        Food food = new Food();
        food.setId(3L);
        food.setUserId(100L);
        food.setGroupId(10L);
        food.setName("딸기");
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setClaimedByUserId(null);
        food.setExpirationDate(LocalDateTime.now().minusDays(1));

        when(foodRepository.findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
                any(), any(), any()))
                .thenReturn(List.of());
        when(foodRepository.findByStatusInAndExpirationDateBefore(any(), any()))
                .thenReturn(List.of(food))
                .thenReturn(List.of());

        scheduler.updateFoodStatuses();

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.SHARED);
        verify(notificationService).sendNotification(
                eq(100L),
                eq(Notification.NotificationType.CLAIM_FAILED),
                any(), any(), eq(10L), any(), eq(3L)
        );
    }

    // 테스트 4: 만료된 PRIVATE/SHARED 음식 → EXPIRING 전환
    @Test
    void updateFoodStatuses_만료된_PRIVATE_EXPIRING전환() {
        Food food = new Food();
        food.setId(4L);
        food.setUserId(100L);
        food.setGroupId(10L);
        food.setStatus(Food.STATUS.PRIVATE);
        food.setExpirationDate(LocalDateTime.now().minusDays(1));

        when(foodRepository.findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
                any(), any(), any()))
                .thenReturn(List.of());
        when(foodRepository.findByStatusInAndExpirationDateBefore(any(), any()))
                .thenReturn(List.of())   // 첫 번째: CANDIDATE 만료 없음
                .thenReturn(List.of(food)); // 두 번째: PRIVATE/SHARED 만료

        scheduler.updateFoodStatuses();

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.EXPIRING);
    }
}
