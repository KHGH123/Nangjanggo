package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    // GET /groups/{groupId}/foods
    @GetMapping("/groups/{groupId}/foods")
    public ResponseEntity<?> getFoodsByGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(foodService.getFoodsByGroup(groupId, user.getUserId(), status, memberId, sort));
    }

    // GET /groups/{groupId}/foods/me — 내 음식 조회 (그룹)
    @GetMapping("/groups/{groupId}/foods/me")
    public ResponseEntity<?> getMyFoodsByGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByUser(groupId, user.getUserId(), status));
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods
    @GetMapping("/groups/{groupId}/fridges/{fridgeId}/foods")
    public ResponseEntity<?> getFoodsByFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(foodService.getFoodsByFridge(groupId, fridgeId, user.getUserId(), status, memberId, sort));
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods/me — 내 음식 조회 (냉장고)
    @GetMapping("/groups/{groupId}/fridges/{fridgeId}/foods/me")
    public ResponseEntity<?> getMyFoodsByFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByFridgeAndUser(groupId, fridgeId, user.getUserId(), status));
    }

    // GET /foods/{foodId} — 음식 상세 조회
    @GetMapping("/foods/{foodId}")
    public ResponseEntity<?> getFoodById(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long foodId) {
        return ResponseEntity.ok(foodService.getFoodById(foodId, user.getUserId()));
    }

    // POST /groups/{groupId}/fridges/{fridgeId}/foods — 음식 추가
    @PostMapping("/groups/{groupId}/fridges/{fridgeId}/foods")
    public ResponseEntity<?> createFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestBody FoodRequestDto.Create dto) {
        dto.setFridgeId(fridgeId);
        return ResponseEntity.ok(foodService.createFood(groupId, user.getUserId(), dto));
    }

    // PUT /foods/{foodId} — 음식 수정
    @PutMapping("/foods/{foodId}")
    public ResponseEntity<?> updateFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long foodId,
            @RequestBody FoodRequestDto.Update dto) {
        return ResponseEntity.ok(foodService.updateFood(user.getUserId(), foodId, dto));
    }

    // DELETE /foods/{foodId} - 단일 음식 삭제
    @DeleteMapping("/foods/{foodId}")
    public ResponseEntity<?> deleteFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long foodId) {
        foodService.deleteFood(user.getUserId(), foodId);
        return ResponseEntity.ok().build();
    }

    // DELETE /foods - 선택 음식 삭제
    @DeleteMapping("/foods")
    public ResponseEntity<?> deleteFoodsByIds(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody List<Long> foodIds) {
        foodService.deleteFoodsByIds(user.getUserId(), foodIds);
        return ResponseEntity.ok().build();
    }

    // DELETE /groups/{groupId}/fridges/{fridgeId}/foods - 그룹 음식 삭제
    @DeleteMapping("/groups/{groupId}/fridges/{fridgeId}/foods")
    public ResponseEntity<?> deleteFridgeFoods(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestParam(required = false) Boolean confirmAll,
            @RequestBody(required = false) List<Long> foodIds) {
        foodService.deleteFridgeFoods(groupId, fridgeId, user.getUserId(), confirmAll, foodIds);
        return ResponseEntity.ok().build();
    }

    // DELETE /groups/{groupId}/members/{memberId}/foods - 멤버 음식 삭제
    @DeleteMapping("/groups/{groupId}/members/{memberId}/foods")
    public ResponseEntity<?> deleteMemberFoods(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @RequestParam(required = false) Boolean confirmAll,
            @RequestBody(required = false) List<Long> foodIds) {
        foodService.deleteMemberFoods(groupId, memberId, user.getUserId(), confirmAll, foodIds);
        return ResponseEntity.ok().build();
    }


    // POST /groups/{groupId}/foods/{foodId}/claim — 찜하기 / 기간 연장
    @PostMapping("/groups/{groupId}/foods/{foodId}/claim")
    public ResponseEntity<?> claimFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long foodId) {
        return ResponseEntity.ok(foodService.claimFood(groupId, user.getUserId(), foodId));
    }

    // DELETE /groups/{groupId}/foods/{foodId}/claim — 찜 취소
    @DeleteMapping("/groups/{groupId}/foods/{foodId}/claim")
    public ResponseEntity<?> unclaimFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long foodId) {
        foodService.unclaimFood(groupId, user.getUserId(), foodId);
        return ResponseEntity.ok().build();
    }




}
