package com.nangjanggo.yangsim;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.food.FoodResponseDto;
import com.nangjanggo.yangsim.food.FoodService;
import com.nangjanggo.yangsim.fridge.Fridge;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.hardware.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HardwareServiceHttpTest {

    static WireMockServer wireMockServer;

    @Mock HardwareDeviceRepository hardwareDeviceRepository;
    @Mock FoodService foodService;
    @Mock FridgeRepository fridgeRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock FoodRepository foodRepository;

    @InjectMocks HardwareService hardwareService;

    @BeforeAll
    static void startWireMock() {
        wireMockServer = new WireMockServer(options().dynamicPort());
        wireMockServer.start();
    }

    @AfterAll
    static void stopWireMock() {
        wireMockServer.stop();
    }

    @BeforeEach
    void resetWireMock() {
        wireMockServer.resetAll();
    }

    private Fridge fridgeInGroup(Long fridgeId, Long groupId) {
        Group group = new Group();
        group.setId(groupId);
        Fridge fridge = new Fridge();
        fridge.setId(fridgeId);
        fridge.setGroup(group);
        return fridge;
    }

    private HardwareDevice deviceWithWireMockUrl(Long fridgeId) {
        HardwareDevice device = new HardwareDevice(fridgeId);
        device.updatePrinterUrl("http://localhost:" + wireMockServer.port());
        return device;
    }

    private FoodResponseDto.Info mockFood() {
        FoodResponseDto.Info food = mock(FoodResponseDto.Info.class);
        when(food.getId()).thenReturn(1L);
        when(food.getUserId()).thenReturn(1L);
        when(food.getStorageDate()).thenReturn(LocalDateTime.now().minusDays(1));
        when(food.getExpirationDate()).thenReturn(LocalDateTime.now().plusDays(3));
        return food;
    }

    // ─── printLabel — 실제 HTTP 호출 테스트 ──────────────────────

    // 테스트 1: 라즈베리파이가 200 응답 → 정상 출력 완료
    @Test
    void printLabel_Pi정상응답_성공() {
        wireMockServer.stubFor(post(urlEqualTo("/print"))
                .willReturn(aResponse().withStatus(200).withBody("ok")));

        FoodResponseDto.Info food = mockFood(); // when() 밖에서 먼저 생성
        GroupMember member = new GroupMember();
        member.setNickname("테스터");
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(deviceWithWireMockUrl(1L)));
        when(foodService.getFoodById(1L, 1L)).thenReturn(food);

        assertThatCode(() -> hardwareService.printLabel(1L, 1L, 1L))
                .doesNotThrowAnyException();

        wireMockServer.verify(postRequestedFor(urlEqualTo("/print"))
                .withHeader("Authorization", containing("Basic"))
                .withHeader("Content-Type", equalTo("application/json")));
    }

    // 테스트 2: 라즈베리파이가 500 응답 → RuntimeException 발생
    @Test
    void printLabel_Pi오류응답_예외발생() {
        wireMockServer.stubFor(post(urlEqualTo("/print"))
                .willReturn(aResponse().withStatus(500).withBody("프린터 오류")));

        FoodResponseDto.Info food = mockFood();
        GroupMember member = new GroupMember();
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(deviceWithWireMockUrl(1L)));
        when(foodService.getFoodById(1L, 1L)).thenReturn(food);

        assertThatThrownBy(() -> hardwareService.printLabel(1L, 1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("프린터 응답 오류");
    }

    // 테스트 3: 요청 본문에 음식명과 QR 코드가 포함됐는지 검증
    @Test
    void printLabel_요청본문에_QR코드포함() {
        wireMockServer.stubFor(post(urlEqualTo("/print"))
                .willReturn(aResponse().withStatus(200)));

        FoodResponseDto.Info food = mockFood();
        GroupMember member = new GroupMember();
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(deviceWithWireMockUrl(1L)));
        when(foodService.getFoodById(1L, 1L)).thenReturn(food);

        hardwareService.printLabel(1L, 1L, 1L);

        // QR 코드 형식이 실제 요청 본문에 포함됐는지 검증
        wireMockServer.verify(postRequestedFor(urlEqualTo("/print"))
                .withRequestBody(containing("yangsimfridge://foods/1"))
                .withRequestBody(containing("qr_text")));
    }

    // ─── checkDeviceHealth — 실제 HTTP 호출 테스트 ───────────────

    // 테스트 4: Pi /health 200 응답 → connected=true
    @Test
    void checkDeviceHealth_Pi정상응답_connected_true() {
        wireMockServer.stubFor(get(urlEqualTo("/health"))
                .willReturn(aResponse().withStatus(200)));

        GroupMember member = new GroupMember();
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(deviceWithWireMockUrl(1L)));

        Map<String, Object> result = hardwareService.checkDeviceHealth(1L, 1L);

        assertThat(result.get("connected")).isEqualTo(true);
    }

    // 테스트 5: Pi /health 500 응답 → connected=false
    @Test
    void checkDeviceHealth_Pi오류응답_connected_false() {
        wireMockServer.stubFor(get(urlEqualTo("/health"))
                .willReturn(aResponse().withStatus(500)));

        GroupMember member = new GroupMember();
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(deviceWithWireMockUrl(1L)));

        Map<String, Object> result = hardwareService.checkDeviceHealth(1L, 1L);

        assertThat(result.get("connected")).isEqualTo(false);
    }

    // 테스트 6: Pi 자체가 꺼져있음 (연결 거부) → connected=false
    @Test
    void checkDeviceHealth_Pi꺼져있음_connected_false() {
        // 아무것도 없는 포트 → 연결 자체가 실패
        HardwareDevice device = new HardwareDevice(1L);
        device.updatePrinterUrl("http://localhost:19999");

        GroupMember member = new GroupMember();
        when(fridgeRepository.findById(1L)).thenReturn(Optional.of(fridgeInGroup(1L, 10L)));
        when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
        when(hardwareDeviceRepository.findByFridgeId(1L)).thenReturn(Optional.of(device));

        Map<String, Object> result = hardwareService.checkDeviceHealth(1L, 1L);

        // 연결 실패 시 exception을 catch해서 connected=false 반환하는지 검증
        assertThat(result.get("connected")).isEqualTo(false);
    }
}
