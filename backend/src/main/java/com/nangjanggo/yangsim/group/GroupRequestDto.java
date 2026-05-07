package com.nangjanggo.yangsim.group;

import lombok.Getter;
import java.time.LocalDate;
import java.util.List;

public class GroupRequestDto {

    @Getter
    public static class Create {
        private String groupName;
        private String nickname;
        private String description;
        private Integer period;
        private Boolean usePersonalDates;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }

    @Getter
    public static class Update {
        private String groupName;
        private String description;
        private Integer period;
        private Boolean usePersonalDates;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }

    @Getter //참여 중 그룹명 제거
    public static class Join {
        private String inviteCode;
        private String nickname;
        private LocalDate joinDate;
        private LocalDate leaveDate;
    }

    @Getter
    public static class UpdateNickname {
        private String nickname;
    }

    @Getter
    public static class UpdateRole {
        private String role;
    }

    @Getter
    public static class KickMembers {
        private List<Long> members;
    }
}