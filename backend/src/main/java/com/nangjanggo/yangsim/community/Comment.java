package com.nangjanggo.yangsim.community;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글이 속한 게시글 ID
    @Column(nullable = false)
    private Long postId;

    // 댓글이 속한 그룹 ID
    @Column(nullable = false)
    private Long groupId;

    // 작성자 userId
    @Column(nullable = false)
    private Long createdBy;

    // 댓글 내용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}