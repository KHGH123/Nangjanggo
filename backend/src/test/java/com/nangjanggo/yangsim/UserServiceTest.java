package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.user.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock PasswordEncoder passwordEncoder;
    @Mock UserRepository userRepository;
    @Mock JavaMailSender mailSender;
    @Mock S3Service s3Service;

    @InjectMocks UserService userService;

    private User userWith(String email, String encodedPassword) {
        User u = new User();
        u.setId(1L);
        u.setEmail(email);
        u.setPassword(encodedPassword);
        u.setName("테스터");
        return u;
    }

    // 테스트 1: 중복 이메일 회원가입 시 예외
    @Test
    void register_중복이메일_예외() {
        when(userRepository.findByEmail("dup@test.com"))
                .thenReturn(Optional.of(userWith("dup@test.com", "encoded")));

        assertThatThrownBy(() -> userService.register("dup@test.com", "password123", "홍길동"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("이미 존재하는 이메일입니다.");
    }

    // 테스트 2: 비밀번호 8자 미만 시 예외
    @Test
    void register_비밀번호_8자미만_예외() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.register("new@test.com", "short", "홍길동"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("비밀번호는 8자 이상이어야 합니다.");
    }

    // 테스트 3: 정상 회원가입 시 저장 호출 확인
    @Test
    void register_정상가입_저장호출() {
        when(userRepository.findByEmail("ok@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded");

        userService.register("ok@test.com", "password123", "홍길동");

        verify(userRepository).save(argThat(u -> u.getEmail().equals("ok@test.com")));
    }

    // 테스트 4: 현재 비밀번호 불일치 시 예외
    @Test
    void updatePassword_현재비밀번호_불일치_예외() {
        User user = userWith("test@test.com", "encodedOld");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPw", "encodedOld")).thenReturn(false);

        assertThatThrownBy(() -> userService.updatePassword(1L, "wrongPw", "newPassword1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("현재 비밀번호가 올바르지 않습니다.");
    }

    // 테스트 5: 새 비밀번호 8자 미만 시 예외
    @Test
    void updatePassword_새비밀번호_8자미만_예외() {
        User user = userWith("test@test.com", "encodedOld");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("currentPw", "encodedOld")).thenReturn(true);

        assertThatThrownBy(() -> userService.updatePassword(1L, "currentPw", "short"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("비밀번호는 8자 이상이어야 합니다.");
    }

    // 테스트 6: 존재하지 않는 이메일로 비밀번호 재설정 코드 발송 시 예외
    @Test
    void sendResetCode_존재하지않는이메일_예외() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.sendResetCode("ghost@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("존재하지 않는 이메일입니다.");
    }

    // 테스트 7: 이미 존재하는 이메일로 회원가입 인증 코드 발송 시 예외
    @Test
    void sendSignupCode_이미존재하는이메일_예외() {
        when(userRepository.findByEmail("exist@test.com"))
                .thenReturn(Optional.of(userWith("exist@test.com", "encoded")));

        assertThatThrownBy(() -> userService.sendSignupCode("exist@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("이미 존재하는 이메일입니다.");
    }

    // 테스트 8: 인증 코드 검증 - 저장된 코드가 없으면 false 반환
    @Test
    void verifyCode_저장된코드없으면_false반환() {
        boolean result = userService.verifyCode("test@test.com", "000000");

        assertThat(result).isFalse();
    }

    // 테스트 9: 비밀번호 재설정 시 8자 미만 예외
    @Test
    void resetPassword_8자미만_예외() {
        assertThatThrownBy(() -> userService.resetPassword("test@test.com", "short"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("비밀번호는 8자 이상이어야 합니다.");
    }
}
