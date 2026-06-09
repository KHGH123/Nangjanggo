package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.food.FoodResponseDto;
import com.nangjanggo.yangsim.printer.LabelPrinterService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LabelPrinterServiceTest {

    @Mock RestTemplate restTemplate;

    @InjectMocks LabelPrinterService labelPrinterService;

    private FoodResponseDto.Info foodWith(Long id, LocalDate storageDate, LocalDate expirationDate) {
        return new FoodResponseDto.Info(
                id, 1L, 1L, 1L, "테스트음식", 1,
                storageDate != null ? storageDate.atStartOfDay() : null,
                expirationDate != null ? expirationDate.atStartOfDay() : null,
                "memo", "CANDIDATE", null, "테스터", null, "tag", false, false, null, null, false
        );
    }

    // ─── printFoodLabel (targetUrl 지정) ────────────────────────────

    @Test
    void printFoodLabel_정상출력() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";
        String targetUrl = "https://my-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        when(restTemplate.postForObject(
                eq(targetUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn("success");

        labelPrinterService.printFoodLabel(food, ownerNickname, targetUrl);

        verify(restTemplate, times(1)).postForObject(
                eq(targetUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void printFoodLabel_URL_null_건너뜀() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);

        labelPrinterService.printFoodLabel(food, ownerNickname, null);

        verify(restTemplate, never()).postForObject(any(), any(), any());
    }

    @Test
    void printFoodLabel_URL_빈문자열_건너뜀() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);

        labelPrinterService.printFoodLabel(food, ownerNickname, "");

        verify(restTemplate, never()).postForObject(any(), any(), any());
    }

    @Test
    void printFoodLabel_날짜포맷_정상생성() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";
        String targetUrl = "https://my-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        when(restTemplate.postForObject(
                anyString(),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn("success");

        labelPrinterService.printFoodLabel(food, ownerNickname, targetUrl);

        // 호출되었는지만 확인 (실제 내용은 프린터에서 확인)
        verify(restTemplate, times(1)).postForObject(
                eq(targetUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void printFoodLabel_storageDate_null() {
        FoodResponseDto.Info food = foodWith(1L, null, LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";
        String targetUrl = "https://my-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        when(restTemplate.postForObject(
                anyString(),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn("success");

        labelPrinterService.printFoodLabel(food, ownerNickname, targetUrl);

        verify(restTemplate, times(1)).postForObject(
                eq(targetUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void printFoodLabel_expirationDate_null() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), null);
        String ownerNickname = "김철수";
        String targetUrl = "https://my-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        when(restTemplate.postForObject(
                anyString(),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn("success");

        labelPrinterService.printFoodLabel(food, ownerNickname, targetUrl);

        verify(restTemplate, times(1)).postForObject(
                eq(targetUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void printFoodLabel_HTTP호출실패_예외() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String ownerNickname = "김철수";
        String targetUrl = "https://my-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        when(restTemplate.postForObject(
                anyString(),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("Connection timeout"));

        assertThatThrownBy(() -> labelPrinterService.printFoodLabel(food, ownerNickname, targetUrl))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("라벨 출력에 실패했습니다");
    }

    // ─── printFoodLabel (기본값 사용) ────────────────────────────────

    @Test
    void printFoodLabel_기본URL_사용() {
        FoodResponseDto.Info food = foodWith(1L, LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 16));
        String printerUrl = "https://default-pi.trycloudflare.com";

        ReflectionTestUtils.setField(labelPrinterService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(labelPrinterService, "printerUrl", printerUrl);

        when(restTemplate.postForObject(
                eq(printerUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn("success");

        labelPrinterService.printFoodLabel(food);

        verify(restTemplate, times(1)).postForObject(
                eq(printerUrl + "/print"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }
}
