package com.nangjanggo.yangsim.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponseDto {
    private Long id;      // user id 반환
    private String email;
    private String name;
}
