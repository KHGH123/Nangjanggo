package com.nangjanggo.yangsim.ranking;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;
    private final GroupMemberHelper groupMemberHelper;

    @GetMapping("/groups/{groupId}/rankings")
    public ResponseEntity<RankingResponseDto> getRanking(
            @PathVariable Long groupId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(rankingService.getRanking(groupId, month));
    }

    // 관리자 전용: 지정 월 스냅샷 수동 트리거 (테스트/운영용)
    // POST /groups/{groupId}/rankings/snapshot?month=2026-05
    @PostMapping("/groups/{groupId}/rankings/snapshot")
    public ResponseEntity<String> triggerSnapshot(
            @PathVariable Long groupId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal CustomUser user) {
        groupMemberHelper.checkAdmin(groupId, user.getId());
        rankingService.snapshotAndResetForGroup(groupId, month);
        String target = (month != null && !month.isBlank()) ? month : "직전 달";
        return ResponseEntity.ok(target + " 스냅샷 저장 완료");
    }
}
