package com.nangjanggo.yangsim.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByGroupIdOrderByCreatedAtDesc(Long groupId);
}