package com.nangjanggo.yangsim.food;

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

    // 매일 자정 실행
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateFoodStatuses() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrowStart = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1);

        // PRIVATE 중 expirationDate가 내일인 것 → CANDIDATE
        List<Food> toCandidate = foodRepository.findByStatusInAndExpirationDateBetween(
                List.of(Food.STATUS.PRIVATE), tomorrowStart, tomorrowEnd);
        toCandidate.forEach(f -> f.status = Food.STATUS.CANDIDATE);

        // CANDIDATE 중 expirationDate가 지난 것 처리
        List<Food> expiredCandidates = foodRepository.findByStatusInAndExpirationDateBefore(
                List.of(Food.STATUS.CANDIDATE), now);
        expiredCandidates.forEach(f -> {
            if (f.claimedByUserId != null) {
                // 찜한 사람이 있으면 그 사람 소유 PRIVATE으로 전환
                f.userId = f.claimedByUserId;
                f.claimedByUserId = null;
                f.status = Food.STATUS.PRIVATE;
            } else {
                // 아무도 안 찜했으면 SHARED
                f.status = Food.STATUS.SHARED;
            }
        });

        // PRIVATE/SHARED 중 expirationDate가 지난 것 → EXPIRING
        List<Food> toExpiring = foodRepository.findByStatusInAndExpirationDateBefore(
                List.of(Food.STATUS.PRIVATE, Food.STATUS.SHARED), now);
        toExpiring.forEach(f -> f.status = Food.STATUS.EXPIRING);
    }
}
