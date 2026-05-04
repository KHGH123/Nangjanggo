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

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JavaMailSender mailSender;

    @InjectMocks UserService userService;

    @Test
    void register_이미존재하는이메일_예외() {
        when(userRepository.findByEmail("test@test.com"))
            .thenReturn(Optional.of(new User()));

        assertThatThrownBy(() -> userService.register("test@test.com", "password123", "홍길동"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("이미 존재하는 이메일입니다.");
    }

    @Test
    void register_비밀번호8자미만_예외() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.register("test@test.com", "1234567", "홍길동"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("비밀번호는 8자 이상이어야 합니다.");
    }

    @Test
    void register_정상_저장호출() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        userService.register("test@test.com", "password123", "홍길동");

        verify(userRepository).save(any(User.class));
    }

    @Test
    void deleteUser_없는유저_예외() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("test@test.com"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("사용자를 찾을 수 없습니다.");
    }

    @Test
    void sendResetCode_없는이메일_예외() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.sendResetCode("test@test.com"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("존재하지 않는 이메일입니다.");
    }

    @Test
    void resetPassword_코드불일치_예외() {
        // codeStore에 아무것도 없으면 null 반환 → 불일치
        assertThatThrownBy(() -> userService.resetPassword("test@test.com", "000000", "newpassword"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("인증 코드가 올바르지 않습니다.");
    }
}
