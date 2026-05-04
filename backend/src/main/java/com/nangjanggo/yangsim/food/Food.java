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
        INFRIDGE, CONSUMED, DISCARDED, DELETED
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
}
