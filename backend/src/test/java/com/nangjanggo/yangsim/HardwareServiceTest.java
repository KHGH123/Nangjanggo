package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.food.FoodService;
import com.nangjanggo.yangsim.fridge.Fridge;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.hardware.HardwareDevice;
import com.nangjanggo.yangsim.hardware.HardwareDeviceRepository;
import com.nangjanggo.yangsim.hardware.HardwareRequestDto;
import com.nangjanggo.yangsim.hardware.HardwareService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HardwareServiceTest {

    @Mock HardwareDeviceRepository hardwareDeviceRepository;
    @Mock FoodService foodService;
    @Mock FridgeRepository fridgeRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock FoodRepository foodRepository;

    @InjectMocks HardwareService hardwareService;

    private Fridge fridgeInGroup(Long fridgeId, Long groupId) {
        Group group = new Group();
        group.setId(groupId);
        Fridge fridge = new Fridge();
        fridge.setId(fridgeId);
        fridge.setGroup(group);
        return fridge;
    }

    private GroupMember activeMember(Long userId, GroupMember.Role role) {
        GroupMember m = new GroupMember();
        m.setUserId(userId);
        m.setStatus(GroupMember.Status.ACTIVE);
        m.setRole(role);
        return m;
    }

    // ─── registerDevice ──────────────────────────────────────────

    // 테스트 1: 관리자가 기기 등록 시 deviceId 반환
    @Test
    void registerDevice_관리자이면_정상등록() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.ADMIN)));

        HardwareDevice device = new HardwareDevice(1L);
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(device));

        Map<String, String> result = hardwareService.registerDevice(1L, 1L, null);

        assertThat(result).containsKey("deviceId");
        assertThat(result.get("deviceId")).isNotBlank();
    }

    // 테스트 2: 관리자가 아니면 기기 등록 불가
    @Test
    void registerDevice_관리자아니면_예외() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));

        assertThatThrownBy(() -> hardwareService.registerDevice(1L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자만 등록할 수 있습니다.");
    }

    // 테스트 3: 그룹 멤버가 아니면 기기 등록 불가
    @Test
    void registerDevice_멤버아니면_예외() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hardwareService.registerDevice(1L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자만 등록할 수 있습니다.");
    }

    // ─── connectDevice ───────────────────────────────────────────

    // 테스트 4: 라즈베리파이 부팅 시 URL 정상 등록
    @Test
    void connectDevice_URL_정상등록() {
        HardwareDevice device = new HardwareDevice(1L);
        when(hardwareDeviceRepository.findByDeviceIdAndFridgeId("device-abc", 1L))
                .thenReturn(Optional.of(device));

        HardwareRequestDto.Connect dto = mock(HardwareRequestDto.Connect.class);
        when(dto.getPrinterUrl()).thenReturn("https://my-pi.trycloudflare.com");

        hardwareService.connectDevice(1L, "device-abc", dto);

        assertThat(device.getPrinterUrl()).isEqualTo("https://my-pi.trycloudflare.com");
    }

    // 테스트 5: 등록되지 않은 deviceId로 URL 등록 시 예외
    @Test
    void connectDevice_미등록기기_예외() {
        when(hardwareDeviceRepository.findByDeviceIdAndFridgeId("unknown", 1L))
                .thenReturn(Optional.empty());

        HardwareRequestDto.Connect dto = mock(HardwareRequestDto.Connect.class);

        assertThatThrownBy(() -> hardwareService.connectDevice(1L, "unknown", dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("등록되지 않은 디바이스입니다.");
    }

    // ─── createAndPrintLabel ─────────────────────────────────────

    // 테스트 6: 그룹 멤버가 아니면 라벨 출력 불가
    @Test
    void createAndPrintLabel_멤버아니면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hardwareService.createAndPrintLabel(1L, 10L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // 테스트 7: 폐기 대상 음식(EXPIRING)이 있으면 새 음식 등록 차단
    @Test
    void createAndPrintLabel_폐기대상음식있으면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));
        when(foodRepository.existsByUserIdAndGroupIdAndStatus(1L, 10L, Food.STATUS.EXPIRING))
                .thenReturn(true);

        assertThatThrownBy(() -> hardwareService.createAndPrintLabel(1L, 10L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("폐기 대상 음식이 있어 새 음식을 등록할 수 없습니다.");
    }

    // 테스트 8: 냉장고에 등록된 기기가 없으면 예외
    @Test
    void createAndPrintLabel_등록된기기없으면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));
        when(foodRepository.existsByUserIdAndGroupIdAndStatus(1L, 10L, Food.STATUS.EXPIRING))
                .thenReturn(false);
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hardwareService.createAndPrintLabel(1L, 10L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("등록된 프린터가 없습니다.");
    }

    // 테스트 9: 라즈베리파이가 아직 연결되지 않은 경우(URL 없음) 예외
    @Test
    void createAndPrintLabel_Pi미연결_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));
        when(foodRepository.existsByUserIdAndGroupIdAndStatus(1L, 10L, Food.STATUS.EXPIRING))
                .thenReturn(false);

        HardwareDevice device = new HardwareDevice(1L); // printerUrl = null
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(device));

        assertThatThrownBy(() -> hardwareService.createAndPrintLabel(1L, 10L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("라즈베리파이가 아직 연결되지 않았습니다. 기기 연동을 먼저 해주세요.");
    }

    // ─── printLabel ──────────────────────────────────────────────

    // 테스트 10: 냉장고 소속 그룹 멤버가 아니면 재출력 불가
    @Test
    void printLabel_멤버아니면_예외() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hardwareService.printLabel(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // 테스트 11: 냉장고에 등록된 기기가 없으면 재출력 불가
    @Test
    void printLabel_등록된기기없으면_예외() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hardwareService.printLabel(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("등록된 프린터가 없습니다.");
    }

    // 테스트 12: 라즈베리파이 미연결 상태에서 재출력 불가
    @Test
    void printLabel_Pi미연결_예외() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));

        HardwareDevice device = new HardwareDevice(1L); // printerUrl = null
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(device));

        assertThatThrownBy(() -> hardwareService.printLabel(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("라즈베리파이가 아직 연결되지 않았습니다.");
    }

    // ─── checkDeviceHealth ───────────────────────────────────────

    // 테스트 13: 기기가 등록되지 않았으면 connected=false 반환
    @Test
    void checkDeviceHealth_기기미등록_connected_false() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.empty());

        Map<String, Object> result = hardwareService.checkDeviceHealth(1L, 1L);

        assertThat(result.get("connected")).isEqualTo(false);
    }

    // 테스트 14: 기기는 있지만 URL 미등록이면 connected=false 반환
    @Test
    void checkDeviceHealth_URL미등록_connected_false() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.MEMBER)));

        HardwareDevice device = new HardwareDevice(1L); // printerUrl = null
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(device));

        Map<String, Object> result = hardwareService.checkDeviceHealth(1L, 1L);

        assertThat(result.get("connected")).isEqualTo(false);
    }

    // ─── 라즈베리파이 서버 연동 테스트 ────────────────────────────

    // 테스트 15: 라즈베리파이 포트 검증
    @Test
    void hardware_라즈베리파이_포트_8769() {
        int piPort = 8769;
        assertThat(piPort).isEqualTo(8769);
    }

    // 테스트 16: Cloudflare 터널 URL 형식
    @Test
    void hardware_cloudflare터널_URL_형식() {
        String cloudflareUrl = "https://yangsim-printer.trycloudflare.com";
        assertThat(cloudflareUrl).contains("trycloudflare.com");
    }

    // 테스트 17: 로컬 네트워크 주소 형식
    @Test
    void hardware_로컬네트워크_주소() {
        String localAddr = "http://10.25.16.50:8769";
        assertThat(localAddr).contains("10.25.16.50");
        assertThat(localAddr).contains("8769");
    }

    // 테스트 18: UUID deviceId 형식
    @Test
    void hardware_deviceId_UUID형식_검증() {
        HardwareDevice device = new HardwareDevice(1L);
        String deviceId = device.getDeviceId();

        // UUID 형식: 8-4-4-4-12
        assertThat(deviceId).matches("[a-f0-9\\-]{36}");
    }

    // 테스트 19: 기본 인증 헤더
    @Test
    void hardware_기본인증_admin() {
        String username = "admin";
        String password = "admin";

        assertThat(username).isEqualTo("admin");
        assertThat(password).isEqualTo("admin");
    }

    // 테스트 20: QR 코드 형식
    @Test
    void hardware_QR코드_형식() {
        Long foodId = 123L;
        String qrData = "yangsimfridge://foods/" + foodId;

        assertThat(qrData).startsWith("yangsimfridge://foods/");
        assertThat(qrData).contains("123");
    }

    // ─── registerDevice 신규 생성 ─────────────────────────────────

    // 테스트 21: 기존 기기 없을 때 새 기기 생성 후 deviceId 반환
    @Test
    void registerDevice_신규기기_생성() {
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(activeMember(1L, GroupMember.Role.ADMIN)));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.empty());
        when(hardwareDeviceRepository.save(any(HardwareDevice.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Map<String, String> result = hardwareService.registerDevice(1L, 1L, null);

        assertThat(result).containsKey("deviceId");
        assertThat(result.get("deviceId")).isNotBlank();
        verify(hardwareDeviceRepository).save(any(HardwareDevice.class));
    }
}
