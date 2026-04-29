package com.nangjanggo.yangsim.user;

import java.util.List;

import org.springframework.security.core.GrantedAuthority;

import lombok.Getter;

@Getter
public class CustomUser extends org.springframework.security.core.userdetails.User {
    //유저 id를 추가하기로 했습니다
    public String name;
    public Long userId;

    public CustomUser(String email, String password, List<GrantedAuthority> authorities, Long userId) {
        super(email, password, authorities);
        this.userId = userId;
    }
}