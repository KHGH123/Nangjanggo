package com.nangjanggo.yangsim.community;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class PostResponseDto {

    // 목록용
    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private Long createdBy;
        private String authorNickname;
        private String title;
        private String content;
        private String postType;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private long likeCount;      // 좋아요 수
        private boolean isLiked;     // 내가 좋아요 눌렀는지
        private long commentCount;   // 댓글 수
    }

    // 상세용
    @Getter
    @AllArgsConstructor
    public static class Detail {
        private Long id;
        private Long createdBy;
        private String authorNickname;
        private String title;
        private String content;
        private String postType;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private long likeCount;
        private boolean isLiked;
        private List<CommentResponseDto.Info> comments;  // 댓글 목록 포함
    }
}