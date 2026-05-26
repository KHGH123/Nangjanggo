package com.nangjanggo.yangsim.food;

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

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateFoodStatuses() {
        updateFoodStatuses(LocalDateTime.now());
    }

    @Transactional
    public void updateFoodStatuses(LocalDateTime now) {
        LocalDateTime tomorrowStart = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1);

        // PRIVATE 중 expirationDate가 내일인 것 → CANDIDATE + 유통기한 임박 알림
        List<Food> toCandidate = foodRepository
                .findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
                        List.of(Food.STATUS.PRIVATE), tomorrowStart, tomorrowEnd);
        toCandidate.forEach(f -> {
            f.status = Food.STATUS.CANDIDATE;
            notificationService.sendNotification(
                    f.userId,
                    Notification.NotificationType.EXPIRY_SOON,
                    "유통기한 임박",
                    "'" + f.name + "'의 유통기한이 내일까지입니다.",
                    f.groupId,
                    Notification.RelatedEntityType.FOOD_ITEM,
                    f.id
            );
        });

        // CANDIDATE 중 expirationDate가 지난 것 처리
        List<Food> expiredCandidates = foodRepository.findByStatusInAndExpirationDateBefore(
                List.of(Food.STATUS.CANDIDATE), now);
        expiredCandidates.forEach(f -> {
            if (f.claimedByUserId != null) {
                // 찜한 사람이 있으면 그 사람 소유 PRIVATE으로 전환 → 찜 성공 알림
                Long newOwnerId = f.claimedByUserId;
                f.userId = f.claimedByUserId;
                f.claimedByUserId = null;
                f.status = Food.STATUS.PRIVATE;
                f.expirationDate = f.expirationDate.plusDays(3);
                f.claimed = true;
                notificationService.sendNotification(
                        newOwnerId,
                        Notification.NotificationType.CLAIM_SUCCESS,
                        "찜 성공",
                        "찜한 '" + f.name + "'이(가) 내 냉장고로 이동되었습니다.",
                        f.groupId,
                        Notification.RelatedEntityType.FOOD_ITEM,
                        f.id
                );
            } else {
                // 아무도 안 찜했으면 SHARED → 찜 실패 알림 (원래 주인에게)
                Long originalOwnerId = f.userId;
                f.status = Food.STATUS.SHARED;
                f.expirationDate = f.expirationDate.plusDays(3);
                notificationService.sendNotification(
                        originalOwnerId,
                        Notification.NotificationType.CLAIM_FAILED,
                        "아무도 찜하지 않았어요",
                        "'" + f.name + "'이(가) 공유 냉장고로 이동되었습니다.",
                        f.groupId,
                        Notification.RelatedEntityType.FOOD_ITEM,
                        f.id
                );
            }
        });

        // PRIVATE/SHARED 중 expirationDate가 지난 것 → EXPIRING
        List<Food> toExpiring = foodRepository.findByStatusInAndExpirationDateBefore(
                List.of(Food.STATUS.PRIVATE, Food.STATUS.SHARED), now);
        toExpiring.forEach(f -> f.status = Food.STATUS.EXPIRING);
    }
}
