package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.ranking.PointResetScheduler;
import com.nangjanggo.yangsim.ranking.RankingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PointResetSchedulerTest {

    @Mock RankingService rankingService;

    @InjectMocks PointResetScheduler pointResetScheduler;

    // ─── monthlyReset ────────────────────────────────────────────────

    @Test
    void monthlyReset_정상실행() {
        pointResetScheduler.monthlyReset();

        verify(rankingService, times(1)).snapshotAndReset();
    }

    @Test
    void monthlyReset_예외발생_전파() {
        doThrow(new RuntimeException("Database error"))
                .when(rankingService).snapshotAndReset();

        try {
            pointResetScheduler.monthlyReset();
        } catch (RuntimeException e) {
            // 예외가 발생하는 것이 정상 동작
            verify(rankingService, times(1)).snapshotAndReset();
            return;
        }

        // 예외가 발생하지 않으면 테스트 실패
        throw new AssertionError("Expected RuntimeException to be thrown");
    }
}
