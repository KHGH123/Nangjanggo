package com.nangjanggo.yangsim.auth;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.nangjanggo.yangsim.user.CustomUser;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var result = userRepository.findByEmail(email);
        if (result.isEmpty()) {
            throw new UsernameNotFoundException("유저를 찾을 수 없습니다: " + email);
        }
        User user = result.get();
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("basic_user"));

        // role이 ADMIN이면 ROLE_ADMIN authority 추가하기
        if (user.getRole() == User.Role.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        CustomUser customUser = new CustomUser(user.getEmail(), user.getPassword(), authorities, user.getId());
        customUser.name = user.getName();
        return customUser;
    }
}