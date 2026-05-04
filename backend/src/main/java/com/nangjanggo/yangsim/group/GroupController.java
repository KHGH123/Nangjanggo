package com.nangjanggo.yangsim.group;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    // GET /groups — 내가 속한 그룹 목록
    @GetMapping
    public ResponseEntity<?> getMyGroups(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(groupService.getMyGroups(user.getUserId()));
    }

    // POST /groups — 그룹 생성
    @PostMapping
    public ResponseEntity<?> createGroup(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody GroupRequestDto.Create dto) {
        return ResponseEntity.ok(groupService.createGroup(user.getUserId(), dto));
    }

    // PUT /groups/{groupId} — 그룹 정보 수정 (관리자)
    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody GroupRequestDto.Update dto) {
        return ResponseEntity.ok(groupService.updateGroup(user.getUserId(), groupId, dto));
    }

    // DELETE /groups/{groupId} — 그룹 삭제 (관리자)
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId) {
        groupService.deleteGroup(user.getUserId(), groupId);
        return ResponseEntity.ok().build();
    }

    // POST /groups/join — 그룹 참여
    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody GroupRequestDto.Join dto) {
        groupService.joinGroup(user.getUserId(), dto);
        return ResponseEntity.ok().build();
    }

    // DELETE /groups/{groupId}/members/me — 그룹 탈퇴
    @DeleteMapping("/{groupId}/members/me")
    public ResponseEntity<?> leaveGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId) {
        groupService.leaveGroup(user.getUserId(), groupId);
        return ResponseEntity.ok().build();
    }

    // PUT /groups/{groupId}/members/me — 닉네임 변경
    @PutMapping("/{groupId}/members/me")
    public ResponseEntity<?> updateMyNickname(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody GroupRequestDto.UpdateNickname dto) {
        groupService.updateMyNickname(user.getUserId(), groupId, dto);
        return ResponseEntity.ok().build();
    }

    // GET /groups/{groupId}/members — 멤버 조회
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getMembers(
            @PathVariable Long groupId,
            @RequestParam(required = false) String nickname) {
        return ResponseEntity.ok(groupService.getMembers(groupId, nickname));
    }

    // PUT /groups/{groupId}/members/{memberId} — 멤버 권한 수정 (관리자)
    @PutMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> updateMemberRole(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @RequestBody GroupRequestDto.UpdateRole dto) {
        groupService.updateMemberRole(user.getUserId(), groupId, memberId, dto);
        return ResponseEntity.ok().build();
    }

    // DELETE /groups/{groupId}/members — 멤버 강퇴 (관리자)
    @DeleteMapping("/{groupId}/members")
    public ResponseEntity<?> kickMembers(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody GroupRequestDto.KickMembers dto) {
        groupService.kickMembers(user.getUserId(), groupId, dto);
        return ResponseEntity.ok().build();
    }
}