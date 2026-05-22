package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    // POST /posts/{postId}/like - 게시글 좋아요
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<?> togglePostLike(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId) {
        return ResponseEntity.ok(likeService.togglePostLike(postId, user.getUserId()));
    }

    // DELETE /posts/{postId}/like — 게시글 좋아요 취소
    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<?> deletePostLike(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId) {
        return ResponseEntity.ok(likeService.deletePostLike(postId, user.getUserId()));
    }



    // POST /comments/{commentId}/like - 댓글 좋아요
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> toggleCommentLike(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long commentId) {
        return ResponseEntity.ok(likeService.toggleCommentLike(commentId, user.getUserId()));
    }

    // DELETE /comments/{commentId}/like — 댓글 좋아요 취소
    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<?> deleteCommentLike(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long commentId) {
        return ResponseEntity.ok(likeService.deleteCommentLike(commentId, user.getUserId()));
    }
}