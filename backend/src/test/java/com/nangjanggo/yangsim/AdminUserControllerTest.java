package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock UserRepository userRepository;
    @InjectMocks AdminUserController adminUserController;

    User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setRole(User.Role.USER);
    }

    @Test
    @DisplayName("USER → ADMIN 권한 변경에 성공한다")
    void updateRole_userToAdmin_success() {
        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        ResponseEntity<Map<String, String>> response =
                adminUserController.updateRole(1L, Map.of("role", "ADMIN"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("role", "ADMIN");
        assertThat(user.getRole()).isEqualTo(User.Role.ADMIN);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("ADMIN → USER 권한 변경에 성공한다")
    void updateRole_adminToUser_success() {
        user.setRole(User.Role.ADMIN);
        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        ResponseEntity<Map<String, String>> response =
                adminUserController.updateRole(1L, Map.of("role", "USER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(user.getRole()).isEqualTo(User.Role.USER);
    }

    @Test
    @DisplayName("잘못된 role 값이면 400을 반환한다")
    void updateRole_invalidRole_returns400() {
        ResponseEntity<Map<String, String>> response =
                adminUserController.updateRole(1L, Map.of("role", "SUPERUSER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsKey("message");
    }

    @Test
    @DisplayName("role 키가 없으면 400을 반환한다")
    void updateRole_missingRole_returns400() {
        ResponseEntity<Map<String, String>> response =
                adminUserController.updateRole(1L, Map.of());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("존재하지 않는 유저 ID면 예외를 던진다")
    void updateRole_userNotFound_throwsException() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminUserController.updateRole(99L, Map.of("role", "ADMIN")))
                .isInstanceOf(EntityNotFoundException.class);
    }
}