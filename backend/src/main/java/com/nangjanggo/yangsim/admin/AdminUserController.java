package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    // 권한 변경 (ADMIN ↔ USER)
    @AdminOnly
    @PatchMapping("/{userId}/role")
    public ResponseEntity<Map<String, String>> updateRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {

        String newRole = body.get("role");
        if (newRole == null || (!newRole.equals("ADMIN") && !newRole.equals("USER"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "role은 ADMIN 또는 USER만 가능합니다."));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("유저를 찾을 수 없습니다."));

        user.setRole(User.Role.valueOf(newRole));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "userId", userId.toString(),
                "role", newRole,
                "message", "권한이 변경되었습니다."
        ));
    }
}