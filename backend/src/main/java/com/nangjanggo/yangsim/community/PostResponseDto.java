package com.nangjanggo.yangsim.community;

import lombok.*;
import java.time.LocalDateTime;

public class PostResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private Long createdBy;
        private String authorNickname;
        private String title;
        private String content;
        private String postType;      // 일단은 NOTICE/FREE 추가해서 보내기
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}