package com.nangjanggo.yangsim.community;

import lombok.*;

public class PostRequestDto {

    @Getter
    public static class Create {
        private String title;
        private String content;
    }

    @Getter
    public static class Update {
        private String title;
        private String content;
    }
}