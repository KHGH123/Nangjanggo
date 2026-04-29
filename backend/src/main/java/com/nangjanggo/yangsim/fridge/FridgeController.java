package com.nangjanggo.yangsim.fridge;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/groups/{groupId}/fridges")
@RequiredArgsConstructor
public class FridgeController {

    private final FridgeService fridgeService;

    // GET /groups/{groupId}/fridges
    @GetMapping
    public ResponseEntity<?> getFridges(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String fridgeName) {
        return ResponseEntity.ok(fridgeService.getFridges(user.getUserId(), groupId, fridgeName));
    }

    // POST /groups/{groupId}/fridges
    @PostMapping
    public ResponseEntity<?> createFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody FridgeRequestDto.Create dto) {
        return ResponseEntity.ok(fridgeService.createFridge(user.getUserId(), groupId, dto));
    }

    // PUT /groups/{groupId}/fridges/{fridgeId}
    @PutMapping("/{fridgeId}")
    public ResponseEntity<?> updateFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestBody FridgeRequestDto.Update dto) {
        return ResponseEntity.ok(
            fridgeService.updateFridge(user.getUserId(), groupId, fridgeId, dto));
    }

    // DELETE /groups/{groupId}/fridges
    @DeleteMapping
    public ResponseEntity<?> deleteFridges(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestBody FridgeRequestDto.Delete dto) {
        fridgeService.deleteFridges(user.getUserId(), groupId, dto);
        return ResponseEntity.ok().build();
    }
}