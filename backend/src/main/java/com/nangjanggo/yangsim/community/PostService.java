package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.notification.Notification;
import com.nangjanggo.yangsim.notification.NotificationService;
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
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    // GET /groups/{groupId}/posts?type=NOTICE&sort=latest
    public List<PostResponseDto.Info> getPosts(Long groupId, Long userId, String type, String sort) {
        groupMemberHelper.checkMember(groupId, userId);
        Post.POST_TYPE postType;
        try {
            postType = Post.POST_TYPE.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 게시글 타입입니다: " + type);
        }

        List<Post> posts;
        if ("popular".equalsIgnoreCase(sort)) {
            posts = postRepository.findByGroupIdAndPostTypeOrderByLikeCountDesc(groupId, postType);
        } else if ("oldest".equalsIgnoreCase(sort)) {
            posts = postRepository.findByGroupIdAndPostTypeOrderByCreatedAtAsc(groupId, postType);
        } else {
            // 기본: 최신순
            posts = postRepository.findByGroupIdAndPostTypeOrderByCreatedAtDesc(groupId, postType);
        }

        return posts.stream()
                .map(p -> toInfo(p, userId))
                .collect(Collectors.toList());
    }

    // GET /posts/{postId} - 게시물 상세 조회
    public PostResponseDto.Detail getPost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);

        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);

        List<CommentResponseDto.Info> commentInfos = comments.stream()
                .map(c -> toCommentInfo(c, userId))
                .collect(Collectors.toList());

        long likeCount = postLikeRepository.countByPostId(postId);
        boolean isLiked = postLikeRepository.existsByPostIdAndUserId(postId, userId);

        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(post.getGroupId(), post.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");

        return new PostResponseDto.Detail(
                post.getId(), post.getCreatedBy(), nickname,
                post.getTitle(), post.getContent(),
                post.getPostType().name(),
                post.getCreatedAt(), post.getUpdatedAt(),
                likeCount, isLiked, commentInfos);
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
        Post saved = postRepository.save(post);

        if (postType == Post.POST_TYPE.NOTICE) {
            String authorNickname = groupMemberRepository
                    .findByGroupIdAndUserId(groupId, userId)
                    .map(GroupMember::getNickname)
                    .orElse("관리자");
            groupMemberRepository.findByGroupId(groupId).stream()
                    .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE && !m.getUserId().equals(userId))
                    .forEach(m -> notificationService.sendNotification(
                            m.getUserId(),
                            Notification.NotificationType.NOTICE_CREATED,
                            "[공지] " + saved.getTitle(),
                            authorNickname + ": " + saved.getContent(),
                            groupId,
                            Notification.RelatedEntityType.POST,
                            saved.getId()
                    ));
        }

        return toInfo(saved, userId);
    }

    // PUT /posts/{postId}
    @Transactional
    public PostResponseDto.Info updatePost(Long userId, Long postId, PostRequestDto.Update dto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);
        if (!post.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
        }
        if (dto.getTitle() != null) post.setTitle(dto.getTitle());
        if (dto.getContent() != null) post.setContent(dto.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        return toInfo(post, userId);
    }

    // DELETE /posts/{postId}
    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);
        boolean isAdmin = groupMemberHelper.isAdmin(post.getGroupId(), userId);
        boolean isAuthor = post.getCreatedBy().equals(userId);
        if (!isAdmin && !isAuthor) {
            throw new IllegalArgumentException("관리자 또는 작성자만 삭제할 수 있습니다.");
        }
        postRepository.delete(post);
    }

    private PostResponseDto.Info toInfo(Post p, Long userId) {
        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(p.getGroupId(), p.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");
        long likeCount = postLikeRepository.countByPostId(p.getId());
        boolean isLiked = postLikeRepository.existsByPostIdAndUserId(p.getId(), userId);
        long commentCount = commentRepository.countByPostId(p.getId());
        return new PostResponseDto.Info(
                p.getId(), p.getCreatedBy(), nickname,
                p.getTitle(), p.getContent(),
                p.getPostType().name(),
                p.getCreatedAt(), p.getUpdatedAt(),
                likeCount, isLiked, commentCount);
    }

    private CommentResponseDto.Info toCommentInfo(Comment c, Long userId) {
        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(c.getGroupId(), c.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");
        long likeCount = commentLikeRepository.countByCommentId(c.getId());
        boolean isLiked = commentLikeRepository.existsByCommentIdAndUserId(c.getId(), userId);
        return new CommentResponseDto.Info(
                c.getId(), c.getCreatedBy(), nickname,
                c.getContent(), c.getCreatedAt(), c.getUpdatedAt(),
                likeCount, isLiked);
    }

}