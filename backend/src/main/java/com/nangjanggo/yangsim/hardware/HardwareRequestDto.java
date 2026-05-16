package com.nangjanggo.yangsim.hardware;

import lombok.Getter;

public class HardwareRequestDto {

    // PATCH /hardware/fridges/{fridgeId}/devices/{deviceId} — 라즈베리파이 IP 등록
    @Getter
    public static class Connect {
        private String printerUrl;
    }

    // POST /hardware/fridges/{fridgeId}/devices — 기기 등록 + IP 저장
    @Getter
    public static class Register {
        private String printerUrl;
    }
}
