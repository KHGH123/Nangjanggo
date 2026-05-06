package com.nangjanggo.yangsim.food;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;

public class FoodResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private Long userId;
        private Long fridgeId;
        private Long groupId;
        private String name;
        private Integer quantity;
        private LocalDateTime storageDate;
        private LocalDateTime expirationDate;
        private String memo;
        private String status;
    }
}
