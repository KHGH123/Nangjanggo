package com.nangjanggo.yangsim.food;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

public class FoodRequestDto {

    @Getter
    @Setter
    public static class Create {
        private Long fridgeId; //일단 fe에서 받아오기
        private String name;
        private Integer quantity;
        private String memo;
        private String tag;
    }

    @Getter
    public static class Update {
        private Long fridgeId;
        private String name;
        private Integer quantity;
        private LocalDateTime storageDate;
        private LocalDateTime expirationDate;
        private String memo;
        private String status;
        private String tag;
    }

    @Getter
    public static class Delete {
        private List<Long> foods;
    }
}