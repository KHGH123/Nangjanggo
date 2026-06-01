package com.nangjanggo.yangsim.ranking;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class RankingResponseDto {

    private String month;
    private List<RankEntry> entries;
    private List<String> availableMonths;

    @Getter
    @AllArgsConstructor
    public static class RankEntry {
        private int rank;
        private String nickname;
        private int point;
        private Long userId;
    }
}
