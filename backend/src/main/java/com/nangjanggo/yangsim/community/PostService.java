package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.nangjanggo.yangsim.group.GroupMemberRepository;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final GroupMemberHelper groupMemberHelper;
    private final GroupMemberRepository groupMemberRepository;

    // GET /groups/{groupId}/posts — 게시글 목록 조회 (그룹원)
    public List<PostResponseDto.Info> getPosts(Long groupId, Long userId) {
        groupMemberHelper.checkMember(groupId, userId);
        return postRepository.findByGroupIdOrderByCreatedAtDesc(groupId)
                .stream()
                .map(this::toInfo)
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
        return toInfo(saved);
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
        return toInfo(post);
    }

    // DELETE /groups/{groupId}/posts/{postId} — 게시글 삭제 (관리자)
    @Transactional
    public void deletePost(Long groupId, Long userId, Long postId) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        postRepository.delete(post);
    }


    // toInfo용 메소드
    private PostResponseDto.Info toInfo(Post p) {
        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(p.getGroupId(), p.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");
        return new PostResponseDto.Info(
                p.getId(), p.getCreatedBy(), nickname,
                p.getTitle(), p.getContent(),
                p.getCreatedAt(), p.getUpdatedAt());
    }

}