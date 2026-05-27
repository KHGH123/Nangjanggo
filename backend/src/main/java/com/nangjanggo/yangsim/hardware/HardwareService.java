package com.nangjanggo.yangsim.hardware;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.food.FoodRequestDto;
import com.nangjanggo.yangsim.food.FoodResponseDto;
import com.nangjanggo.yangsim.food.FoodService;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HardwareService {

    private final HardwareDeviceRepository hardwareDeviceRepository;
    private final FoodService foodService;
    private final FridgeRepository fridgeRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FoodRepository foodRepository;

    private static final DateTimeFormatter LABEL_FMT = DateTimeFormatter.ofPattern("yy.MM.dd");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // POST /hardware/fridges/{fridgeId}/devices — 관리자가 라즈베리파이 등록, deviceId 발급
    @Transactional
    public Map<String, String> registerDevice(Long fridgeId, Long userId, HardwareRequestDto.Register dto) {
        Long groupId = fridgeRepository.findById(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."))
                .getGroup().getId();

        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("관리자만 등록할 수 있습니다."));

        HardwareDevice device = hardwareDeviceRepository.findByFridgeId(fridgeId)
                .orElseGet(() -> hardwareDeviceRepository.save(new HardwareDevice(fridgeId)));

        return Map.of("deviceId", device.getDeviceId());
    }

    // PATCH /hardware/fridges/{fridgeId}/devices/{deviceId} — 라즈베리파이 부팅 시 Cloudflare URL 등록
    @Transactional
    public void connectDevice(Long fridgeId, String deviceId, HardwareRequestDto.Connect dto) {
        HardwareDevice device = hardwareDeviceRepository.findByDeviceIdAndFridgeId(deviceId, fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 디바이스입니다."));
        device.updatePrinterUrl(dto.getPrinterUrl());
    }

    // POST /hardware/fridges/{fridgeId}/label/new — 음식 생성 + EC2가 Pi에 직접 출력
    @Transactional
    public Map<String, Object> createAndPrintLabel(Long fridgeId, Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        boolean hasExpiring = foodRepository.existsByUserIdAndGroupIdAndStatus(
                userId, groupId, Food.STATUS.EXPIRING);
        if (hasExpiring) {
            throw new IllegalArgumentException("폐기 대상 음식이 있어 새 음식을 등록할 수 없습니다.");
        }

        HardwareDevice device = hardwareDeviceRepository.findByFridgeId(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("등록된 프린터가 없습니다."));

        if (device.getPrinterUrl() == null) {
            throw new IllegalArgumentException("라즈베리파이가 아직 연결되지 않았습니다. 기기 연동을 먼저 해주세요.");
        }

        FoodRequestDto.Create dto = new FoodRequestDto.Create();
        dto.setFridgeId(fridgeId);
        FoodResponseDto.Info food = foodService.createFood(groupId, userId, dto);

        String nickname = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(GroupMember::getNickname)
                .orElse("알 수 없음");

        callPrinter(device.getPrinterUrl(),
                buildLabelText(food, nickname),
                "yangsimfridge://foods/" + food.getId());

        return Map.of("foodId", food.getId());
    }

    // POST /hardware/fridges/{fridgeId}/label — 기존 음식 라벨 재출력
    public Map<String, Object> printLabel(Long fridgeId, Long foodId, Long userId) {
        Long groupId = fridgeRepository.findById(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."))
                .getGroup().getId();

        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        HardwareDevice device = hardwareDeviceRepository.findByFridgeId(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("등록된 프린터가 없습니다."));

        if (device.getPrinterUrl() == null) {
            throw new IllegalArgumentException("라즈베리파이가 아직 연결되지 않았습니다.");
        }

        FoodResponseDto.Info food = foodService.getFoodById(foodId, userId);
        String nickname = groupMemberRepository.findByGroupIdAndUserId(groupId, food.getUserId())
                .map(GroupMember::getNickname)
                .orElse("알 수 없음");

        callPrinter(device.getPrinterUrl(),
                buildLabelText(food, nickname),
                "yangsimfridge://foods/" + food.getId());

        return Map.of("foodId", foodId);
    }

    // GET /hardware/fridges/{fridgeId}/devices/health — 연결 상태 확인
    public Map<String, Object> checkDeviceHealth(Long fridgeId, Long userId) {
        Long groupId = fridgeRepository.findById(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."))
                .getGroup().getId();

        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        HardwareDevice device = hardwareDeviceRepository.findByFridgeId(fridgeId).orElse(null);
        if (device == null || device.getPrinterUrl() == null) {
            return Map.of("connected", false, "reason", "기기가 등록되지 않았습니다.");
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(device.getPrinterUrl() + "/health"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return Map.of("connected", response.statusCode() == 200);
        } catch (Exception e) {
            return Map.of("connected", false, "reason", "라즈베리파이에 연결할 수 없습니다.");
        }
    }

    private void callPrinter(String printerUrl, String text, String qrText) {
        try {
            String body = MAPPER.writeValueAsString(Map.of("text", text, "qr_text", qrText));
            String auth = Base64.getEncoder().encodeToString("admin:admin".getBytes());

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(printerUrl + "/print"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Basic " + auth)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("프린터 응답 오류: " + response.body());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("라벨 출력에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private String buildLabelText(FoodResponseDto.Info food, String nickname) {
        String stored = food.getStorageDate() != null ? food.getStorageDate().format(LABEL_FMT) : "";
        String expiry = food.getExpirationDate() != null ? food.getExpirationDate().format(LABEL_FMT) : "";
        return "ID: " + food.getId() + "\n소유자: " + nickname + "\n" + stored + "~" + expiry;
    }
}
