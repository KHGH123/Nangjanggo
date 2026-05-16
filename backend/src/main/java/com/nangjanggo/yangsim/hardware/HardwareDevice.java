package com.nangjanggo.yangsim.hardware;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "hardware_device")
public class HardwareDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String deviceId; // UUID, 라즈베리파이 식별자

    @Column(nullable = false, unique = true)
    private Long fridgeId;

    @Column
    private String printerUrl; // 부팅 시 등록, 초기엔 null

    public HardwareDevice(Long fridgeId) {
        this.fridgeId = fridgeId;
        this.deviceId = UUID.randomUUID().toString();
    }

    public void updatePrinterUrl(String printerUrl) {
        this.printerUrl = printerUrl;
    }
}
