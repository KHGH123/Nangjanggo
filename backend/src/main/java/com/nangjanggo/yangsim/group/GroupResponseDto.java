package com.nangjanggo.yangsim.group;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class GroupResponseDto {

    // 그룹 목록 조회 — memberCount 인원 수
    @Getter
    @AllArgsConstructor
    public static class Summary {
        private Long id;
        private String groupName;
        private int memberCount;
    }

    // 멤버 조회 — role == ACTIVE
    @Getter
    @AllArgsConstructor
    public static class MemberInfo {
        private Long memberId;
        private String nickname;
        private String role;
    }
}