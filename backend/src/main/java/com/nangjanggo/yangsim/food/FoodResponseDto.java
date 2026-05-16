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
        private Long claimedByUserId;
        private String ownerName;
    }


    //음식 불러오기용
    @Getter
    @AllArgsConstructor
    public static class FoodSummary {
        private Long foodId;
        private String status;
        private Integer quantity;
        private LocalDateTime storedDate;
        private LocalDateTime expirationDate;
        private Long ownerId;
        private String ownerNickname;
    }




}
