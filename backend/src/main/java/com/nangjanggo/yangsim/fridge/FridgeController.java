package com.nangjanggo.yangsim.fridge;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups/{groupId}/fridges")
@RequiredArgsConstructor
public class FridgeController {

    private final FridgeService fridgeService;

    @GetMapping
    public ResponseEntity<?> getFridges(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String fridgeName,
            Sort sort) {
        return ResponseEntity.ok(fridgeService.getFridges(user.getUserId(), groupId, fridgeName, sort));
    }

    @PostMapping
    public ResponseEntity<?> createFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody FridgeRequestDto.Create dto) {
        return ResponseEntity.ok(fridgeService.createFridge(user.getUserId(), groupId, dto));
    }

    @GetMapping("/{fridgeId}")
    public ResponseEntity<?> getFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId) {
        return ResponseEntity.ok(fridgeService.getFridge(user.getUserId(), groupId, fridgeId));
    }

    @PutMapping("/{fridgeId}")
    public ResponseEntity<?> updateFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestBody FridgeRequestDto.Update dto) {
        fridgeService.updateFridge(user.getUserId(), groupId, fridgeId, dto);
        return ResponseEntity.ok(fridgeId);
    }

    @DeleteMapping("/{fridgeId}")
    public ResponseEntity<?> deleteFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId) {
        fridgeService.deleteFridge(user.getUserId(), groupId, fridgeId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFridges(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) Boolean confirmAll,
            @RequestParam(required = false) List<Long> fridgeIds) {
        fridgeService.deleteFridges(user.getUserId(), groupId, confirmAll, fridgeIds);
        return ResponseEntity.ok().build();
    }
}
