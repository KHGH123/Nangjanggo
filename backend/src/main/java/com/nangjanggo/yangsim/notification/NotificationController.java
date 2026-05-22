package com.nangjanggo.yangsim.notification;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/token")
    public ResponseEntity<?> registerToken(@AuthenticationPrincipal CustomUser user,
                                           @RequestBody NotificationRequestDto.RegisterToken dto) {
        notificationService.registerToken(user.getUserId(), dto.getToken());
        return ResponseEntity.ok(Map.of("message", "토큰이 등록되었습니다."));
    }

    @DeleteMapping("/token")
    public ResponseEntity<?> deleteToken(@AuthenticationPrincipal CustomUser user) {
        notificationService.deleteToken(user.getUserId());
        return ResponseEntity.ok(Map.of("message", "토큰이 삭제되었습니다."));
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(notificationService.getSettings(user.getUserId()));
    }

    @PatchMapping("/settings")
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal CustomUser user,
                                            @RequestBody NotificationRequestDto.UpdateSettings dto) {
        notificationService.updateSettings(user.getUserId(), dto);
        return ResponseEntity.ok(Map.of("message", "설정이 변경되었습니다."));
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getUserId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(notificationService.getUnreadCount(user.getUserId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal CustomUser user,
                                        @PathVariable Long id) {
        notificationService.markAsRead(user.getUserId(), id);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOne(@AuthenticationPrincipal CustomUser user,
                                       @PathVariable Long id) {
        notificationService.deleteOne(user.getUserId(), id);
        return ResponseEntity.ok(Map.of("message", "알림이 삭제되었습니다."));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAll(@AuthenticationPrincipal CustomUser user) {
        notificationService.deleteAll(user.getUserId());
        return ResponseEntity.ok(Map.of("message", "모든 알림이 삭제되었습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
