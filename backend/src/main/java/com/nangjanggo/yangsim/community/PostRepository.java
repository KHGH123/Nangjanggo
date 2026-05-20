package com.nangjanggo.yangsim.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    // 타입별 조회
    List<Post> findByGroupIdAndPostTypeOrderByCreatedAtDesc(Long groupId, Post.POST_TYPE postType);
}