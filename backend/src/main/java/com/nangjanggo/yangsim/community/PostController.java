package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/groups/{groupId}/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<?> getPosts(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId) {
        return ResponseEntity.ok(postService.getPosts(groupId, user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody PostRequestDto.Create dto) {
        return ResponseEntity.ok(postService.createPost(groupId, user.getUserId(), dto));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestBody PostRequestDto.Update dto) {
        return ResponseEntity.ok(postService.updatePost(groupId, user.getUserId(), postId, dto));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long postId) {
        postService.deletePost(groupId, user.getUserId(), postId);
        return ResponseEntity.ok().build();
    }
}