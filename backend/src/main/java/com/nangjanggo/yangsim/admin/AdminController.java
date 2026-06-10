package com.nangjanggo.yangsim.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ① 사용자 목록 (이름 검색 + 정렬)
    @AdminOnly
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "name") String sort,       // name | adminGroupCount | groupCount
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsers(search, sort, direction, page, size));
    }

    // ② 그룹 목록 (이름 검색 + 정렬)
    @AdminOnly
    @GetMapping("/groups")
    public ResponseEntity<Page<AdminGroupDto>> getGroups(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "name") String sort,       // name | memberCount | fridgeCount
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getGroups(search, sort, direction, page, size));
    }

    // ③ 그룹 상세 → 냉장고 목록
    @AdminOnly
    @GetMapping("/groups/{groupId}/fridges")
    public ResponseEntity<List<AdminFridgeDto>> getFridgesByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(adminService.getFridgesByGroup(groupId));
    }

    // ④ 냉장고 상세 → 음식 목록
    @AdminOnly
    @GetMapping("/fridges/{fridgeId}/foods")
    public ResponseEntity<List<AdminFoodSummaryDto>> getFoodsByFridge(@PathVariable Long fridgeId) {
        return ResponseEntity.ok(adminService.getFoodsByFridge(fridgeId));
    }

    // ⑤ 음식 상세
    @AdminOnly
    @GetMapping("/foods/{foodId}")
    public ResponseEntity<AdminFoodDetailDto> getFoodDetail(@PathVariable Long foodId) {
        return ResponseEntity.ok(adminService.getFoodDetail(foodId));
    }

    // 사용자 → 그룹 목록
    @AdminOnly
    @GetMapping("/users/{userId}/groups")
    public ResponseEntity<List<AdminGroupDto>> getGroupsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getGroupsByUser(userId));
    }

}