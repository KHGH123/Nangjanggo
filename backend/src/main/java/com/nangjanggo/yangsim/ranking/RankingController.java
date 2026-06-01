package com.nangjanggo.yangsim.ranking;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/groups/{groupId}/rankings")
    public ResponseEntity<RankingResponseDto> getRanking(
            @PathVariable Long groupId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(rankingService.getRanking(groupId, month));
    }
}
