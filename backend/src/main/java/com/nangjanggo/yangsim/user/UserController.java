package com.nangjanggo.yangsim.user;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    public ResponseEntity<?> register(@RequestBody UserRequestDto.Register dto) {
        userService.register(dto.getEmail(), dto.getPassword(), dto.getName());
        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDto.Login dto) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
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

    @PutMapping("/mypage")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUser user,
            @RequestBody UserRequestDto.UpdateProfile dto) {
        userService.updateProfile(user.getUserId(), dto.getName(), dto.getEmail());
        return ResponseEntity.ok(Map.of("message", "프로필이 수정되었습니다."));
    }

    @PutMapping("/mypage/pwd")
    public ResponseEntity<?> updatePassword(@AuthenticationPrincipal CustomUser user,
            @RequestBody UserRequestDto.UpdatePassword dto) {
        userService.updatePassword(user.getUserId(), dto.getCurrentPassword(), dto.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    @DeleteMapping("/mypage")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal CustomUser user) {
        userService.deleteUser(user.getUserId());
        return ResponseEntity.ok(Map.of("message", "탈퇴가 완료되었습니다."));
    }

    @PostMapping("/user/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody UserRequestDto.ForgotPassword dto) {
        userService.sendResetCode(dto.getEmail());
        return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
    }

    @PostMapping("/user/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody UserRequestDto.ResetPassword dto) {
        userService.resetPassword(dto.getEmail(), dto.getCode(), dto.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
