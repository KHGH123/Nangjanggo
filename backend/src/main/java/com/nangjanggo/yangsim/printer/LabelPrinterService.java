package com.nangjanggo.yangsim.printer;

import com.nangjanggo.yangsim.food.FoodResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class LabelPrinterService {

    private final RestTemplate restTemplate;

    public LabelPrinterService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);  // 연결 대기 10초
        factory.setReadTimeout(30_000);     // 응답 대기 30초 (프린터 처리 시간 고려)
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${printer.url:}")
    private String printerUrl;

    public void printFoodLabel(FoodResponseDto.Info food, String ownerNickname, String targetUrl) {
        if (targetUrl == null || targetUrl.isBlank()) {
            log.info("프린터 URL 미설정, 라벨 출력 건너뜀");
            return;
        }
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yy.MM.dd");
            String storedStr = food.getStorageDate() != null ? food.getStorageDate().format(fmt) : "";
            String expiryStr = food.getExpirationDate() != null ? food.getExpirationDate().format(fmt) : "";

            String text = "ID: " + food.getId() + "\n소유자: " + ownerNickname + "\n" + storedStr + "~" + expiryStr;
            String qrText = "yangsimfridge://foods/" + food.getId();

            String auth = Base64.getEncoder().encodeToString("admin:admin".getBytes());
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Basic " + auth);
            headers.set("Content-Type", "application/json");

            restTemplate.postForObject(
                    targetUrl + "/print",
                    new HttpEntity<>(Map.of("text", text, "qr_text", qrText), headers),
                    String.class
            );
            log.info("라벨 출력 완료: {}", text);
        } catch (Exception e) {
            log.warn("라벨 출력 실패: {}", e.getMessage());
            throw new RuntimeException("라벨 출력에 실패했습니다: " + e.getMessage());
        }
    }

    // 기존 방식 유지 (printer.url 설정값 사용)
    public void printFoodLabel(FoodResponseDto.Info food) {
        printFoodLabel(food, "", printerUrl);
    }
}
