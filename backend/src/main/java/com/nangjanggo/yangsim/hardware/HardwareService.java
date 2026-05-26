package com.nangjanggo.yangsim.hardware;

import com.nangjanggo.yangsim.food.FoodRequestDto;
import com.nangjanggo.yangsim.food.FoodResponseDto;
import com.nangjanggo.yangsim.food.FoodService;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.printer.LabelPrinterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;

@Service
@RequiredArgsConstructor
public class HardwareService {

    private final HardwareDeviceRepository hardwareDeviceRepository;
    private final FoodService foodService;
    private final FridgeRepository fridgeRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final LabelPrinterService labelPrinterService;
    private final FoodRepository foodRepository;

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

        if (dto != null && dto.getPrinterUrl() != null) {
            if (!pingHost(dto.getPrinterUrl())) {
                throw new IllegalArgumentException("라즈베리파이에 연결할 수 없습니다. IP를 확인해주세요.");
            }
            device.updatePrinterUrl(dto.getPrinterUrl());
        }

        return Map.of("deviceId", device.getDeviceId());
    }

    // PATCH /hardware/fridges/{fridgeId}/devices/{deviceId} — 라즈베리파이 부팅 시 IP 등록
    @Transactional
    public void connectDevice(Long fridgeId, String deviceId, HardwareRequestDto.Connect dto) {
        HardwareDevice device = hardwareDeviceRepository.findByDeviceIdAndFridgeId(deviceId, fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 디바이스입니다."));
        device.updatePrinterUrl(dto.getPrinterUrl());
    }

    // POST /hardware/fridges/{fridgeId}/label/new — 음식 임시 생성 + 라벨 출력 + foodId 반환
    @Transactional
    public Map<String, Object> createAndPrintLabel(Long fridgeId, Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));


        // EXPIRING 음식 있으면 등록 차단
        boolean hasExpiring = foodRepository.existsByUserIdAndGroupIdAndStatus(
                userId, groupId, Food.STATUS.EXPIRING);
        if (hasExpiring) {
            throw new IllegalArgumentException("폐기 대상 음식이 있어 새 음식을 등록할 수 없습니다.");
        }


        HardwareDevice device = hardwareDeviceRepository.findByFridgeId(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("등록된 프린터가 없습니다."));

        if (device.getPrinterUrl() == null) {
            throw new IllegalArgumentException("라즈베리파이가 아직 연결되지 않았습니다.");
        }

        FoodRequestDto.Create dto = new FoodRequestDto.Create();
        dto.setFridgeId(fridgeId);
        FoodResponseDto.Info food = foodService.createFood(groupId, userId, dto);

        String nickname = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getNickname())
                .orElse("알 수 없음");

        labelPrinterService.printFoodLabel(food, nickname, device.getPrinterUrl());

        return Map.of("foodId", food.getId());
    }

    private boolean pingHost(String printerUrl) {
        try {
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection)
                    java.net.URI.create(printerUrl + "/print").toURL().openConnection();
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setRequestMethod("GET");
            conn.connect();
            conn.getResponseCode();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // POST /hardware/fridges/{fridgeId}/label — foodId로 라벨만 출력
    public void printLabel(Long fridgeId, Long foodId, Long userId) {
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
                .map(m -> m.getNickname())
                .orElse("알 수 없음");

        labelPrinterService.printFoodLabel(food, nickname, device.getPrinterUrl());
    }
}
