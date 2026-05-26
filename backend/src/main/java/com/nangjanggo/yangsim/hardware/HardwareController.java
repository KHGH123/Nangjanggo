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
            @PathVariable Long fridgeId,
            @RequestBody(required = false) HardwareRequestDto.Register dto) {
        return ResponseEntity.ok(hardwareService.registerDevice(fridgeId, user.getUserId(), dto));
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

    // POST /hardware/fridges/{fridgeId}/label — 기존 음식 라벨 재출력
    @PostMapping("/hardware/fridges/{fridgeId}/label")
    public ResponseEntity<?> printLabel(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long fridgeId,
            @RequestParam Long foodId) {
        return ResponseEntity.ok(hardwareService.printLabel(fridgeId, foodId, user.getUserId()));
    }

    // POST /hardware/fridges/{fridgeId}/label/new — 음식 생성 + EC2가 Pi에 직접 출력 (NFC 플로우)
    @PostMapping("/hardware/fridges/{fridgeId}/label/new")
    public ResponseEntity<?> createAndPrintLabel(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long fridgeId,
            @RequestParam Long groupId) {
        return ResponseEntity.ok(hardwareService.createAndPrintLabel(fridgeId, groupId, user.getUserId()));
    }

    // GET /hardware/fridges/{fridgeId}/devices/health — 라즈베리파이 연결 상태 확인
    @GetMapping("/hardware/fridges/{fridgeId}/devices/health")
    public ResponseEntity<?> checkDeviceHealth(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable Long fridgeId) {
        return ResponseEntity.ok(hardwareService.checkDeviceHealth(fridgeId, user.getUserId()));
    }
}
