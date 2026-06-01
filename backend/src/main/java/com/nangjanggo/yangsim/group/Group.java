package com.nangjanggo.yangsim.group;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "`group`")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Group {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "period")
    private Integer period;

    @Column(name = "use_personal_dates")
    private Boolean usePersonalDates = false;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "inspection_day")
    private Integer inspectionDay;

    @Column(name = "discard_threshold")
    private Integer discardThreshold;

    @Column(name = "ranking_cycle_months", columnDefinition = "INT DEFAULT 1")
    private Integer rankingCycleMonths = 1;

    @Column(name = "notification_hour", columnDefinition = "INT DEFAULT 0")
    private Integer notificationHour = 0; // 알림 발송 시각 (0~23, 기본 자정)
}