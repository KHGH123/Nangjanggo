package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.user.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminUserDto {
    private Long id;
    private String name;
    private String email;
    private long adminGroupCount;   // 관리자로 등록된 그룹 수
    private long groupCount;        // 참여한 그룹 수

    public static AdminUserDto from(User u, long adminGroupCount, long groupCount) {
        return AdminUserDto.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .adminGroupCount(adminGroupCount)
                .groupCount(groupCount)
                .build();
    }
}