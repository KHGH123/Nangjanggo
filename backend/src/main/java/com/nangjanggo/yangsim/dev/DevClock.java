package com.nangjanggo.yangsim.dev;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Component
public class DevClock {
    private LocalDateTime mockNow = null;

    public LocalDateTime now() {
        return mockNow != null ? mockNow : LocalDateTime.now();
    }

    public LocalDate today() {
        return now().toLocalDate();
    }

    public YearMonth currentMonth() {
        return YearMonth.from(now());
    }

    public void setMock(LocalDateTime dateTime) {
        this.mockNow = dateTime;
    }

    public void clear() {
        this.mockNow = null;
    }
}
