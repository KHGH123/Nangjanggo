package com.nangjanggo.yangsim.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 최신순
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    // 오래된순
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    // 인기순
    @Query("SELECT c FROM Comment c LEFT JOIN CommentLike cl ON c.id = cl.commentId " +
            "WHERE c.postId = :postId " +
            "GROUP BY c.id ORDER BY COUNT(cl.id) DESC")
    List<Comment> findByPostIdOrderByLikeCountDesc(@Param("postId") Long postId);

    long countByPostId(Long postId);
}