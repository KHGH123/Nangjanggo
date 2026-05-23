package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // GET /posts/{postId}/comments
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<?> getComments(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getComments(postId, user.getUserId()));
    }

    // POST /posts/{postId}/comments
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId,
            @RequestBody CommentRequestDto.Create dto) {
        return ResponseEntity.ok(commentService.createComment(postId, user.getUserId(), dto));
    }

    // PUT /comments/{commentId}
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long commentId,
            @RequestBody CommentRequestDto.Update dto) {
        return ResponseEntity.ok(commentService.updateComment(user.getUserId(), commentId, dto));
    }

    // DELETE /comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long commentId) {
        commentService.deleteComment(user.getUserId(), commentId);
        return ResponseEntity.ok().build();
    }
}