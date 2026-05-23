package com.nangjanggo.yangsim.community;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_like",
        uniqueConstraints = @UniqueConstraint(columnNames = {"comment_id", "user_id"}))
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentLike {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 좋아요 누른 댓글 ID
    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    // 좋아요 누른 사용자 ID
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 좋아요 누른 시각
    @Column(nullable = false)
    private LocalDateTime createdAt;
}