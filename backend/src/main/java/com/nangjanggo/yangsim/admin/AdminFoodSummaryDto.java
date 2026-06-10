package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.food.Food;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminFoodSummaryDto {
    private Long id;
    private String name;
    private Integer quantity;
    private LocalDateTime expirationDate;
    private String status;

    public static AdminFoodSummaryDto from(Food f) {
        return AdminFoodSummaryDto.builder()
                .id(f.getId())
                .name(f.getName())
                .quantity(f.getQuantity())
                .expirationDate(f.getExpirationDate())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .build();
    }
}