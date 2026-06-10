package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.auth.CustomUserDetailsService;
import com.nangjanggo.yangsim.user.CustomUser;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock UserRepository userRepository;

    @InjectMocks CustomUserDetailsService customUserDetailsService;

    private User userWith(Long id, String email, String password, String name) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setPassword(password);
        u.setName(name);
        return u;
    }

    // ─── loadUserByUsername ────────────────────────────────────────

    @Test
    void loadUserByUsername_존재하는유저_정상조회() {
        String email = "test@example.com";
        User user = userWith(1L, email, "encoded_password", "테스터");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserDetails result = customUserDetailsService.loadUserByUsername(email);

        assertThat(result).isInstanceOf(CustomUser.class);
        assertThat(result.getUsername()).isEqualTo(email);
        assertThat(result.getPassword()).isEqualTo("encoded_password");

        CustomUser customUser = (CustomUser) result;
        assertThat(customUser.getUserId()).isEqualTo(1L);
        assertThat(customUser.name).isEqualTo("테스터");
    }

    @Test
    void loadUserByUsername_존재하지않는유저_예외() {
        String email = "notfound@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(email))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("유저를 찾을 수 없습니다: " + email);
    }

    @Test
    void loadUserByUsername_권한_기본사용자로설정() {
        String email = "test@example.com";
        User user = userWith(1L, email, "password", "테스터");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserDetails result = customUserDetailsService.loadUserByUsername(email);

        assertThat(result.getAuthorities()).hasSize(1);
        GrantedAuthority authority = result.getAuthorities().stream().findFirst().orElse(null);
        assertThat(authority).isNotNull();
        assertThat(authority.getAuthority()).isEqualTo("basic_user");
    }

    @Test
    void loadUserByUsername_이메일null_예외() {
        when(userRepository.findByEmail(null)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(null))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadUserByUsername_이메일빈문자열_예외() {
        when(userRepository.findByEmail("")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(""))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
