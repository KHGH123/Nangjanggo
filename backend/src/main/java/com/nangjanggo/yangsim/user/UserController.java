package com.nangjanggo.yangsim.user;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.nangjanggo.yangsim.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        userService.register(body.get("email"), body.get("password"), body.get("name"));
        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
<<<<<<< Updated upstream
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(body.get("email"), body.get("password"))
        );
        return ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(auth)));
    }

    @DeleteMapping("/mypage")
    public ResponseEntity<?> deleteUser(Authentication auth) {
        userService.deleteUser(auth.getName());
        return ResponseEntity.ok(Map.of("message", "마이페이지가 삭제되었습니다."));
=======
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(body.get("email"), body.get("password"))
            );
            return ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(auth)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }
    }

    @GetMapping("/mypage")
    public ResponseEntity<?> getMyPage(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(userService.getMyPage(user.getUserId()));
    }

    @DeleteMapping("/mypage")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal CustomUser user) {
        userService.deleteUser(user.getUserId());
        return ResponseEntity.ok(Map.of("message", "탈퇴가 완료되었습니다."));
>>>>>>> Stashed changes
    }

    @PostMapping("/user/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        userService.sendResetCode(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
    }

    @PostMapping("/user/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        userService.resetPassword(body.get("email"), body.get("code"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
