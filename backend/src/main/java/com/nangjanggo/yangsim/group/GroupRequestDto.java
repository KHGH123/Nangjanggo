package com.nangjanggo.yangsim.group;

import lombok.Getter;
import java.util.List;

public class GroupRequestDto {

    // 그룹 생성
    @Getter
    public static class Create {
        private String groupName;
        private String nickname;
        private String inviteCode;
        private String description;
    }

    // 그룹 정보 수정 (관리자) 이름, 설명, 기간 설정
    @Getter
    public static class Update {
        private String groupName;
        private String description;
        private Integer period;
    }

    // 그룹 참여(그룹명, 초대코드, 그룹 내 닉네임(근데, 그룹명이 꼭 필요할까요?))
    @Getter
    public static class Join {
        private String groupName;
        private String inviteCode;
        private String nickname;
    }

    // 그룹 내 닉네임 변경
    @Getter
    public static class UpdateNickname {
        private String nickname;
    }

    // 멤버 권한 수정 (관리자)
    @Getter
    public static class UpdateRole {
        private String role;
    }

    // 멤버 강퇴 (관리자) — 우선 선택 삭제만 구현
    @Getter
    public static class KickMembers {
        private List<Long> members;
    }
}