package com.nangjanggo.yangsim.hardware;

import lombok.Getter;

public class HardwareRequestDto {

    // PATCH /hardware/fridges/{fridgeId}/devices/{deviceId} — 라즈베리파이 IP 등록
    @Getter
    public static class Connect {
        private String printerUrl;
    }
}
