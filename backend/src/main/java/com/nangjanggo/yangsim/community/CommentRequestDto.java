package com.nangjanggo.yangsim.community;

import lombok.*;

public class CommentRequestDto {

    @Getter
    public static class Create {
        private String content;
    }

    @Getter
    public static class Update {
        private String content;
    }
}