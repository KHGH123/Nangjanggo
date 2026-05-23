package com.nangjanggo.yangsim.community;

import lombok.*;

public class PostRequestDto {

    @Getter
    public static class Create {
        private String title;
        private String content;

        // FREE면 null 가능, NOTICE면 관리자만
        private String postType;
    }

    @Getter
    public static class Update {
        private String title;
        private String content;
    }
}