package com.nangjanggo.yangsim.community;

import lombok.*;
import java.time.LocalDateTime;

public class CommentResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private Long createdBy;
        private String authorNickname;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private long likeCount;
        private boolean isLiked;
    }
}