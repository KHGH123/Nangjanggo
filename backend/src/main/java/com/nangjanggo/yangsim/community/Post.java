package com.nangjanggo.yangsim.community;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    // 게시글 타입 — NOTICE(공지, 관리자만 작성), FREE(자유, 그룹원 누구나)
    public enum POST_TYPE {
        NOTICE, FREE
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long groupId;

    @Column(nullable = false)
    private Long createdBy;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 게시글 타입 (NOTICE / FREE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private POST_TYPE postType;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}