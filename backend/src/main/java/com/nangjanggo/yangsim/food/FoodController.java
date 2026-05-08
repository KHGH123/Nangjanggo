package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    // GET /groups/{groupId}/foods — 그룹에서 모든 음식 조회
    @GetMapping("/groups/{groupId}/foods")
    public ResponseEntity<?> getFoodsByGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByGroup(groupId, user.getUserId(), status));
    }

    // GET /groups/{groupId}/foods/me — 그룹에서 내 음식 조회
    @GetMapping("/groups/{groupId}/foods/me")
    public ResponseEntity<?> getMyFoodsByGroup(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByUser(groupId, user.getUserId(), status));
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods — 특정 냉장고에서 모든 음식 조회
    @GetMapping("/groups/{groupId}/fridges/{fridgeId}/foods")
    public ResponseEntity<?> getFoodsByFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByFridge(groupId, fridgeId, user.getUserId(), status));
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods/me — 특정 냉장고에서 내 음식 조회
    @GetMapping("/groups/{groupId}/fridges/{fridgeId}/foods/me")
    public ResponseEntity<?> getMyFoodsByFridge(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long fridgeId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foodService.getFoodsByFridgeAndUser(groupId, fridgeId, user.getUserId(), status));
    }

    // GET /groups/{groupId}/foods/{foodId} — 특정 음식 상세 조회
    @GetMapping("/groups/{groupId}/foods/{foodId}")
    public ResponseEntity<?> getFoodById(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long foodId) {
        return ResponseEntity.ok(foodService.getFoodById(groupId, foodId, user.getUserId()));
    }

    // POST /groups/{groupId}/users/{userId}/foods — 음식 추가
    @PostMapping("/groups/{groupId}/users/{userId}/foods")
    public ResponseEntity<?> createFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @RequestBody FoodRequestDto.Create dto) {
        return ResponseEntity.ok(foodService.createFood(groupId, user.getUserId(), dto));
    }

    // PUT /groups/{groupId}/users/{userId}/foods/{foodId} — 음식 수정
    @PutMapping("/groups/{groupId}/users/{userId}/foods/{foodId}")
    public ResponseEntity<?> updateFood(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @PathVariable Long foodId,
            @RequestBody FoodRequestDto.Update dto) {
        return ResponseEntity.ok(foodService.updateFood(groupId, user.getUserId(), foodId, dto));
    }

    // DELETE /groups/{groupId}/users/{userId}/foods — 음식 삭제
    @DeleteMapping("/groups/{groupId}/users/{userId}/foods")
    public ResponseEntity<?> deleteFoods(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @RequestBody FoodRequestDto.Delete dto) {
        foodService.deleteFoods(groupId, user.getUserId(), dto);
        return ResponseEntity.ok().build();
    }

}
