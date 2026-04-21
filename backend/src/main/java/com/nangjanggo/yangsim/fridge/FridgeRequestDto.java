package com.nangjanggo.yangsim.fridge;

import lombok.Getter;
import java.util.List;

public class FridgeRequestDto {

    @Getter
    public static class Create {
        private String fridgeName;
    }

    @Getter
    public static class Update {
        private String fridgeName;
    }

    @Getter
    public static class Delete {
        private List<Long> fridges;
    }
}
