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
        private String imageUrl;
        private String tag;
        private Boolean extended;
        private Boolean claimed;
        private Long consumedByUserId;
        private String consumedByName;
        private Boolean suspicious;
    }


    //음식 불러오기용
    @Getter
    @AllArgsConstructor
    public static class FoodSummary {
        private Long foodId;
        private String name;
        private String status;
        private Integer quantity;
        private LocalDateTime storageDate;
        private LocalDateTime expirationDate;
        private String memo;
        private Long ownerId;
        private String ownerNickname;
        private String tag;
        private String imageUrl;
        private Long claimedByUserId;
        private Boolean extended;
    }

    // 관리자용 전체 음식 목록
    @Getter
    @AllArgsConstructor
    public static class AdminFoodSummary {
        private Long foodId;
        private Long ownerId;
        private String ownerNickname;
        private String name;
        private String status;
        private Boolean suspicious;
    }

    // 관리자용 음식 상세
    @Getter
    @AllArgsConstructor
    public static class AdminFoodDetail {
        private Long foodId;
        private Long ownerId;
        private String ownerNickname;
        private String name;
        private String status;
        private Integer quantity;
        private LocalDateTime storageDate;
        private LocalDateTime expirationDate;
        private String memo;
        private String tag;
        private String imageUrl;
        private Long claimedByUserId;
        private String claimedByNickname;
        private Boolean extended;
        private Boolean claimed;
        private Long consumedByUserId;
        private String consumedByNickname;
        private LocalDateTime consumedAt;
        private Boolean suspicious;
    }
}
