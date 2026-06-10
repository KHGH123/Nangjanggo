package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.group.Group;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminGroupDto {
    private Long id;
    private String name;
    private String description;
    private long memberCount;
    private long fridgeCount;
    private String createdByName; // ← 추가

    public static AdminGroupDto from(Group g, long memberCount, long fridgeCount) {
        return AdminGroupDto.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .memberCount(memberCount)
                .fridgeCount(fridgeCount)
                .createdByName(null) // Service에서 채움
                .build();
    }
}