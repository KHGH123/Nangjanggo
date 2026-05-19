package com.nangjanggo.yangsim.community;

import lombok.*;
import java.time.LocalDateTime;

public class PostResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private Long createdBy;
        private String title;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}