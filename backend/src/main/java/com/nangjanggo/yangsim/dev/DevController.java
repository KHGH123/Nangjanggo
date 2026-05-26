package com.nangjanggo.yangsim.dev;

import com.nangjanggo.yangsim.food.FoodStatusScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dev")
public class DevController {

    private final FoodStatusScheduler foodStatusScheduler;

    // POST /dev/scheduler  body: { "datetime": "2026-05-28T00:00:00" }
    @PostMapping("/scheduler")
    public ResponseEntity<?> runScheduler(@RequestBody Map<String, String> body) {
        String datetimeStr = body.get("datetime");
        LocalDateTime datetime = datetimeStr != null
                ? LocalDateTime.parse(datetimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : LocalDateTime.now();
        foodStatusScheduler.updateFoodStatuses(datetime);
        return ResponseEntity.ok(Map.of("message", "스케줄러 실행 완료", "datetime", datetime.toString()));
    }
}
