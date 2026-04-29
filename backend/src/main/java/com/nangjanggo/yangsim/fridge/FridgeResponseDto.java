package com.nangjanggo.yangsim.fridge;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class FridgeResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private String fridgeName;
        private Integer sequenceNo;
    }
}