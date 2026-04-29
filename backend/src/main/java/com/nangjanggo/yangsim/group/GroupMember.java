package com.nangjanggo.yangsim.group;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "group_member")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ACTIVE;

    public enum Role { ADMIN, MEMBER }
    public enum Status { ACTIVE, LEFT, KICKED }
}