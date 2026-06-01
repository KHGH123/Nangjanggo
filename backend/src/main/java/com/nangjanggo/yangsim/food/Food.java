package com.nangjanggo.yangsim.food;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Food {
    
    public enum STATUS {
        PRIVATE, CANDIDATE, SHARED, EXPIRING, CONSUMED
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    Long userId;
    @Column(nullable = false)
    Long fridgeId;
    @Column(nullable = false)
    Long groupId;

    String name;
    Integer quantity;
    LocalDateTime storageDate;
    LocalDateTime expirationDate;
    String memo;
    STATUS status;

    @Column(name = "claimed_by_user_id")
    Long claimedByUserId; // 찜한 사용자 ID (CANDIDATE 상태일 때)

    @Column(name = "claimed")
    Boolean claimed = false;  // 찜으로 소유자 변경된 적 있음

    @Column(name = "extended")
    Boolean extended = false;  // 기간 연장된 적 있음

    @Column(name = "image_url")
    String imageUrl;

    @Column(name = "tag")
    String tag;

    @Column(name = "consumed_by_user_id")
    Long consumedByUserId; // 폐기/소비한 사용자 ID

    @Column(name = "suspicious")
    Boolean suspicious = false; // QR 스캔 시 이미 폐기됨 상태로 감지된 경우
}
