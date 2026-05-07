package com.nangjanggo.yangsim.group;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class GroupResponseDto {

    @Getter
    @AllArgsConstructor
    public static class Info {
        private Long id;
        private String groupName;
        private int memberCount;
        private boolean isAdmin;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }

    // 그룹 목록 조회 — memberCount 인원 수
    @Getter
    @AllArgsConstructor
    public static class Summary {
        private Long id;
        private String groupName;
        private int memberCount;
        private boolean isAdmin;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }

    // 멤버 조회 — role == ACTIVE
    @Getter
    @AllArgsConstructor
    public static class MemberInfo {
        private Long memberId;
        private String nickname;
        private String role;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }
}