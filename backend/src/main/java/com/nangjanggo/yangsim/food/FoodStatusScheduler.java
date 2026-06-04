package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.dev.DevClock;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.notification.Notification;
import com.nangjanggo.yangsim.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FoodStatusScheduler {

    private final FoodRepository foodRepository;
    private final NotificationService notificationService;
    private final GroupRepository groupRepository;
    private final DevClock devClock;

    // 자정: 상태 계산만 (알림 없음)
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateFoodStatuses() {
        updateFoodStatuses(devClock.now());
    }

    // 매 시간: 각 그룹의 notificationHour에 맞춰 알림만 발송
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendScheduledNotifications() {
        int currentHour = LocalDateTime.now().getHour();
        groupRepository.findAll().stream()
            .filter(g -> {
                int h = g.getNotificationHour() != null ? g.getNotificationHour() : 8;
                return h == currentHour;
            })
            .forEach(g -> sendNotificationsForGroup(g.getId()));
    }

    @Transactional
    public void updateFoodStatuses(LocalDateTime now) {
        LocalDateTime tomorrowStart = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1);
        LocalDateTime newExpirationDate = now.toLocalDate().plusDays(3).atStartOfDay();

        // EXPIRING → PRIVATE: 날짜가 앞으로 이동해서 유통기한이 아직 안 됐을 때 (역방향 보정)
        foodRepository.findByStatusInAndExpirationDateAfter(List.of(Food.STATUS.EXPIRING), now)
            .forEach(f -> f.status = Food.STATUS.PRIVATE);

        // CANDIDATE → PRIVATE: 날짜가 앞으로 이동해서 D-1 구간 벗어났을 때 (역방향 보정)
        foodRepository.findByStatusInAndExpirationDateAfter(List.of(Food.STATUS.CANDIDATE), tomorrowEnd)
            .forEach(f -> f.status = Food.STATUS.PRIVATE);

        // PRIVATE 중 내일 만료 → CANDIDATE
        foodRepository.findByStatusInAndClaimedFalseAndExpirationDateBetween(
                List.of(Food.STATUS.PRIVATE), tomorrowStart, tomorrowEnd)
            .forEach(f -> f.status = Food.STATUS.CANDIDATE);

        // CANDIDATE 중 만료된 것(당일 포함) → 찜 있으면 PRIVATE 이전, 없으면 SHARED
        foodRepository.findByStatusInAndExpirationDateLessThanEqual(List.of(Food.STATUS.CANDIDATE), now)
            .forEach(f -> {
                if (f.claimedByUserId != null) {
                    f.userId = f.claimedByUserId;
                    f.claimedByUserId = null;
                    f.status = Food.STATUS.PRIVATE;
                    f.expirationDate = newExpirationDate;
                    f.claimed = true;
                } else {
                    f.status = Food.STATUS.SHARED;
                    f.expirationDate = newExpirationDate;
                }
            });

        // PRIVATE 중 만료된 것 → EXPIRING
        foodRepository.findByStatusInAndExpirationDateBefore(List.of(Food.STATUS.PRIVATE), now)
            .forEach(f -> f.status = Food.STATUS.EXPIRING);

        // SHARED 중 만료된 것 → EXPIRING
        foodRepository.findByStatusInAndExpirationDateBefore(List.of(Food.STATUS.SHARED), now)
            .forEach(f -> f.status = Food.STATUS.EXPIRING);

    }

    private void sendNotificationsForGroup(Long groupId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrowStart = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1);

        // CANDIDATE 상태 음식 → 유통기한 임박 알림
        foodRepository.findByStatusInAndClaimedFalseAndExpirationDateBetween(
                List.of(Food.STATUS.CANDIDATE), tomorrowStart, tomorrowEnd)
            .stream().filter(f -> groupId.equals(f.groupId))
            .forEach(f -> notificationService.sendNotification(
                f.userId, Notification.NotificationType.EXPIRY_SOON,
                "유통기한 임박 — " + f.name,
                "'" + f.name + "'의 유통기한이 내일까지입니다. 소비, 공용 전환, 또는 연장 중 선택해주세요.",
                f.groupId, Notification.RelatedEntityType.FOOD_ITEM, f.id));

        // 찜 성공/실패 알림 (만료된 CANDIDATE — 자정에 상태 변경됐으므로 PRIVATE/SHARED에서 claimed 플래그로 구분)
        foodRepository.findByGroupId(groupId).stream()
            .filter(f -> (f.status == Food.STATUS.PRIVATE && Boolean.TRUE.equals(f.claimed))
                      || f.status == Food.STATUS.SHARED)
            .filter(f -> f.expirationDate != null
                      && f.expirationDate.toLocalDate().equals(now.toLocalDate().plusDays(3)))
            .forEach(f -> {
                if (f.status == Food.STATUS.PRIVATE) {
                    notificationService.sendNotification(
                        f.userId, Notification.NotificationType.CLAIM_SUCCESS,
                        "찜 성공", "찜한 '" + f.name + "'이(가) 내 냉장고로 이동되었습니다.",
                        f.groupId, Notification.RelatedEntityType.FOOD_ITEM, f.id);
                } else {
                    notificationService.sendNotification(
                        f.userId, Notification.NotificationType.CLAIM_FAILED,
                        "아무도 찜하지 않았어요", "'" + f.name + "'이(가) 공유 냉장고로 이동되었습니다.",
                        f.groupId, Notification.RelatedEntityType.FOOD_ITEM, f.id);
                }
            });
    }
}
