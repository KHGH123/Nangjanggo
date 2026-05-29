package com.nangjanggo.yangsim.user;

import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;
    private String password;
    private String name;
    private String profileImageUrl;
    private String pushToken;
    private boolean pushEnabled = true;
    private boolean expiryAlertEnabled = true;
    // 찜
    private boolean sharedPurchaseAlertEnabled = true;
    private boolean boardAlertEnabled = true;
}
