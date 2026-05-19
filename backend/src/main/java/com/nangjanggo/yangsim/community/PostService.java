package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final GroupMemberHelper groupMemberHelper;

    // GET /groups/{groupId}/posts — 게시글 목록 조회 (그룹원)
    public List<PostResponseDto.Info> getPosts(Long groupId, Long userId) {
        groupMemberHelper.checkMember(groupId, userId);
        return postRepository.findByGroupIdOrderByCreatedAtDesc(groupId)
                .stream()
                .map(p -> new PostResponseDto.Info(
                        p.getId(), p.getCreatedBy(),
                        p.getTitle(), p.getContent(),
                        p.getCreatedAt(), p.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    // POST /groups/{groupId}/posts — 게시글 작성 (관리자)
    @Transactional
    public PostResponseDto.Info createPost(Long groupId, Long userId, PostRequestDto.Create dto) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Post post = new Post();
        post.setGroupId(groupId);
        post.setCreatedBy(userId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setCreatedAt(LocalDateTime.now());
        Post saved = postRepository.save(post);
        return new PostResponseDto.Info(
                saved.getId(), saved.getCreatedBy(),
                saved.getTitle(), saved.getContent(),
                saved.getCreatedAt(), saved.getUpdatedAt());
    }

    // PUT /groups/{groupId}/posts/{postId} — 게시글 수정 (관리자)
    @Transactional
    public PostResponseDto.Info updatePost(Long groupId, Long userId, Long postId, PostRequestDto.Update dto) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (dto.getTitle() != null) post.setTitle(dto.getTitle());
        if (dto.getContent() != null) post.setContent(dto.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        return new PostResponseDto.Info(
                post.getId(), post.getCreatedBy(),
                post.getTitle(), post.getContent(),
                post.getCreatedAt(), post.getUpdatedAt());
    }

    // DELETE /groups/{groupId}/posts/{postId} — 게시글 삭제 (관리자)
    @Transactional
    public void deletePost(Long groupId, Long userId, Long postId) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        postRepository.delete(post);
    }
}