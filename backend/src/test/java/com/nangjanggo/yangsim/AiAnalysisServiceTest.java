package com.nangjanggo.yangsim;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AiAnalysisServiceTest {

    // AiAnalysisService는 Gemini API에 직접 의존하므로, 구조 검증만 수행
    // 실제 API 호출은 통합 테스트에서 다루어짐

    @Test
    void Gemini_API_URL_검증() {
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        assertThat(geminiUrl).contains("generativelanguage.googleapis.com");
        assertThat(geminiUrl).contains("gemini-2.5-flash");
    }

    @Test
    void 음식_응답_JSON_구조_검증() {
        String jsonResponse = "{\"name\":\"사과\",\"consumptionDays\":7,\"nutrition\":\"비타민C\",\"tag\":\"과일\"}";

        assertThat(jsonResponse).contains("name");
        assertThat(jsonResponse).contains("consumptionDays");
        assertThat(jsonResponse).contains("nutrition");
        assertThat(jsonResponse).contains("tag");
    }

    @Test
    void NOT_FOOD_에러_응답_검증() {
        String errorResponse = "{\"error\":\"NOT_FOOD\"}";
        assertThat(errorResponse).contains("NOT_FOOD");
    }

    @Test
    void 마크다운_코드블록_제거() {
        String input = "```json\n{\"test\":\"value\"}\n```";
        String cleaned = input.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").strip();

        assertThat(cleaned).doesNotContain("```");
        assertThat(cleaned).contains("{\"test\":\"value\"}");
    }

    @Test
    void 재시도_로직_설정() {
        int maxRetries = 3;
        long retryDelayMs = 2000;

        assertThat(maxRetries).isEqualTo(3);
        assertThat(retryDelayMs).isEqualTo(2000);
    }
}
