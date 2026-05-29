package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // GET /groups/{groupId}/posts?type=NOTICE&sort=latest
    @GetMapping("/groups/{groupId}/posts")
    public ResponseEntity<?> getPosts(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false, defaultValue = "NOTICE") String type,
            @RequestParam(required = false, defaultValue = "latest") String sort) {
        return ResponseEntity.ok(postService.getPosts(groupId, user.getUserId(), type, sort));
    }

    // GET /posts/{postId}
    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId) {
        return ResponseEntity.ok(postService.getPost(postId, user.getUserId()));
    }

    // POST /groups/{groupId}/posts
    @PostMapping("/groups/{groupId}/posts")
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody PostRequestDto.Create dto) {
        return ResponseEntity.ok(postService.createPost(groupId, user.getUserId(), dto));
    }

    // PUT /posts/{postId}
    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId,
            @RequestBody PostRequestDto.Update dto) {
        return ResponseEntity.ok(postService.updatePost(user.getUserId(), postId, dto));
    }

    // DELETE /posts/{postId}
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long postId) {
        postService.deletePost(user.getUserId(), postId);
        return ResponseEntity.ok().build();
    }
}