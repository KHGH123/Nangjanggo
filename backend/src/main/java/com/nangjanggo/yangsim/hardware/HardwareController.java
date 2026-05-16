package com.nangjanggo.yangsim.hardware;

import com.nangjanggo.yangsim.user.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class HardwareController {

    private final HardwareService hardwareService;

    // POST /hardware/fridges/{fridgeId}/devices — 관리자가 라즈베리파이 등록, deviceId 발급
    @PostMapping("/hardware/fridges/{fridgeId}/devices")
    public ResponseEntity<?> registerDevice(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long fridgeId) {
        return ResponseEntity.ok(hardwareService.registerDevice(fridgeId, user.getUserId()));
    }

    // PATCH /hardware/fridges/{fridgeId}/devices/{deviceId} — 라즈베리파이 부팅 시 IP 등록
    @PatchMapping("/hardware/fridges/{fridgeId}/devices/{deviceId}")
    public ResponseEntity<?> connectDevice(
            @PathVariable Long fridgeId,
            @PathVariable String deviceId,
            @RequestBody HardwareRequestDto.Connect dto) {
        hardwareService.connectDevice(fridgeId, deviceId, dto);
        return ResponseEntity.ok().build();
    }

    // POST /hardware/fridges/{fridgeId}/label — 라벨 출력 (그룹원 검증 포함)
    @PostMapping("/hardware/fridges/{fridgeId}/label")
    public ResponseEntity<?> printLabel(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long fridgeId,
            @RequestParam Long foodId) {
        hardwareService.printLabel(fridgeId, foodId, user.getUserId());
        return ResponseEntity.ok().build();
    }
}
