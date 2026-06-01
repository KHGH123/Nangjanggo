package com.nangjanggo.yangsim.ranking;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking_history")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class RankingHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long groupId;
    private Long userId;
    private String nickname;
    private int point;
    private int rankPosition;
    private String month; // "2026-05"
    private LocalDateTime snapshotAt = LocalDateTime.now();
}
