package com.nangjanggo.yangsim.ranking;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PointResetScheduler {

    private final RankingService rankingService;

    // 매월 1일 자정: 전월 랭킹 스냅샷 저장 + 포인트 초기화
    @Scheduled(cron = "0 0 0 1 * *")
    public void monthlyReset() {
        rankingService.snapshotAndReset();
    }
}
