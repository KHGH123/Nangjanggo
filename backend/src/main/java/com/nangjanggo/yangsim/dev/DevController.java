package com.nangjanggo.yangsim.dev;

import com.nangjanggo.yangsim.food.FoodStatusScheduler;
import com.nangjanggo.yangsim.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dev")
public class DevController {

    private final FoodStatusScheduler foodStatusScheduler;
    private final RankingService rankingService;

    // POST /dev/scheduler  body: { "datetime": "2026-05-28T00:00:00" }
    @PostMapping("/scheduler")
    public ResponseEntity<?> runScheduler(@RequestBody Map<String, String> body) {
        String datetimeStr = body.get("datetime");
        LocalDateTime datetime = datetimeStr != null
                ? LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : LocalDateTime.now();

        foodStatusScheduler.updateFoodStatuses(datetime);

        // 해당 날짜가 1일이면 랭킹 스냅샷도 함께 실행
        if (datetime.getDayOfMonth() == 1) {
            rankingService.snapshotAndReset(YearMonth.from(datetime));
        }

        return ResponseEntity.ok(Map.of(
                "message", "스케줄러 실행 완료" + (datetime.getDayOfMonth() == 1 ? " (랭킹 스냅샷 포함)" : ""),
                "datetime", datetime.toString()
        ));
    }
}
