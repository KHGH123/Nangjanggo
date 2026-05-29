package com.nangjanggo.yangsim.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 최신순
    List<Post> findByGroupIdAndPostTypeOrderByCreatedAtDesc(Long groupId, Post.POST_TYPE postType);

    // 오래된순
    List<Post> findByGroupIdAndPostTypeOrderByCreatedAtAsc(Long groupId, Post.POST_TYPE postType);

    // 인기순 (좋아요 많은순) — PostLike 테이블 조인 필요
    @Query("SELECT p FROM Post p LEFT JOIN PostLike pl ON p.id = pl.postId " +
            "WHERE p.groupId = :groupId AND p.postType = :postType " +
            "GROUP BY p.id ORDER BY COUNT(pl.id) DESC")
    List<Post> findByGroupIdAndPostTypeOrderByLikeCountDesc(
            @Param("groupId") Long groupId,
            @Param("postType") Post.POST_TYPE postType);
}