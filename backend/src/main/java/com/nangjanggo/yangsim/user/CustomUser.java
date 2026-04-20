package com.nangjanggo.yangsim.user;

import java.util.List;

import org.springframework.security.core.GrantedAuthority;

import lombok.Getter;

@Getter
public class CustomUser extends org.springframework.security.core.userdetails.User {
    // 뭘 추가할지는 나중에 생각해보자
    public String name;
    
    public CustomUser(String email, String password, List<GrantedAuthority> authorities) {
        super(email, password, authorities);
    }

}
