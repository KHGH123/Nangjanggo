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
        private String description;
        private Integer period;
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
        private Boolean usePersonalDates;
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
        @com.fasterxml.jackson.annotation.JsonProperty("isMe")
        private boolean isMe;
        private String profileImageUrl;
        private int point;
    }


    // 초대코드로 그룹 조회 응답 — 참여 화면 구성용
    @Getter
    @AllArgsConstructor
    public static class JoinInfo {
        private Long groupId;
        private String groupName;
        private Boolean usePersonalDates;
    }
}