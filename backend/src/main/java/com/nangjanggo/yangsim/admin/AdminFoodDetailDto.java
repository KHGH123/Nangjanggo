package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.food.Food;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminFoodDetailDto {
    private Long id;
    private String name;
    private Integer quantity;
    private LocalDateTime storageDate;
    private LocalDateTime expirationDate;
    private String memo;
    private String status;
    private String registeredByName;   // 등록자 이름 (Service에서 조회)
    private Long claimedByUserId;
    private Boolean claimed;

    public static AdminFoodDetailDto from(Food f, String registeredByName) {
        return AdminFoodDetailDto.builder()
                .id(f.getId())
                .name(f.getName())
                .quantity(f.getQuantity())
                .storageDate(f.getStorageDate())
                .expirationDate(f.getExpirationDate())
                .memo(f.getMemo())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .registeredByName(registeredByName)
                .claimedByUserId(f.getClaimedByUserId())
                .claimed(f.getClaimed())
                .build();
    }
}