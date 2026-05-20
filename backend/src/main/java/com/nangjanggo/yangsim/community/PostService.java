package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
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
    private final GroupMemberRepository groupMemberRepository;

    // GET /groups/{groupId}/posts?type=NOTICE or FREE
    public List<PostResponseDto.Info> getPosts(Long groupId, Long userId, String type) {
        groupMemberHelper.checkMember(groupId, userId);
        Post.POST_TYPE postType = Post.POST_TYPE.valueOf(type.toUpperCase());
        return postRepository.findByGroupIdAndPostTypeOrderByCreatedAtDesc(groupId, postType)
                .stream()
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    // POST /groups/{groupId}/posts
    @Transactional
    public PostResponseDto.Info createPost(Long groupId, Long userId, PostRequestDto.Create dto) {
        Post.POST_TYPE postType;
        try {
            postType = dto.getPostType() != null
                    ? Post.POST_TYPE.valueOf(dto.getPostType().toUpperCase())
                    : Post.POST_TYPE.NOTICE;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 게시글 타입입니다: " + dto.getPostType());
        }

        // NOTICE 타입은 관리자만 작성 가능
        if (postType == Post.POST_TYPE.NOTICE) {
            groupMemberHelper.checkAdmin(groupId, userId);
        } else {
            groupMemberHelper.checkMember(groupId, userId);
        }

        Post post = new Post();
        post.setGroupId(groupId);
        post.setCreatedBy(userId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setPostType(postType);

        post.setCreatedAt(LocalDateTime.now());
        return toInfo(postRepository.save(post));
    }

    // PUT /groups/{groupId}/posts/{postId} — 작성자만 수정 가능
    @Transactional
    public PostResponseDto.Info updatePost(Long groupId, Long userId, Long postId, PostRequestDto.Update dto) {
        groupMemberHelper.checkMember(groupId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
        }
        if (dto.getTitle() != null) post.setTitle(dto.getTitle());
        if (dto.getContent() != null) post.setContent(dto.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        return toInfo(post);
    }

    // DELETE /groups/{groupId}/posts/{postId} — 관리자 또는 작성자 삭제 가능
    @Transactional
    public void deletePost(Long groupId, Long userId, Long postId) {
        groupMemberHelper.checkMember(groupId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        boolean isAdmin = groupMemberHelper.isAdmin(groupId, userId);
        boolean isAuthor = post.getCreatedBy().equals(userId);
        if (!isAdmin && !isAuthor) {
            throw new IllegalArgumentException("관리자 또는 작성자만 삭제할 수 있습니다.");
        }
        postRepository.delete(post);
    }

    private PostResponseDto.Info toInfo(Post p) {
        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(p.getGroupId(), p.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");
        return new PostResponseDto.Info(
                p.getId(), p.getCreatedBy(), nickname,
                p.getTitle(), p.getContent(),
                p.getPostType().name(),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}