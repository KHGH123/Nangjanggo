package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.fridge.Fridge;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminFridgeDto {
    private Long id;
    private String name;
    private long foodCount;

    public static AdminFridgeDto from(Fridge f) {
        return AdminFridgeDto.builder()
                .id(f.getId())
                .name(f.getName())
                .foodCount(0L)  // foodRepository 주입 없이 Service에서 별도 조회 가능, 여기선 0 기본
                .build();
    }
}