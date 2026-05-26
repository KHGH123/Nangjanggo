package com.nangjanggo.yangsim.food;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class AiAnalysisService {

    @Value("${gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private static final String PROMPT =
            "이 사진이 음식 사진인지 먼저 판단하세요. " +
            "음식이 아니라면 {\"error\":\"NOT_FOOD\"} 만 반환하세요. " +
            "음식이 맞다면 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.\n" +
            "{\"name\":\"음식이름\",\"consumptionDays\":평균소비일수(숫자),\"nutrition\":\"간단한영양정보\"," +
            "\"tag\":\"태그(육류/채소/과일/유제품/해산물/가공식품/음료/조미료/기타 중 하나)\"}";

    public FoodAnalysisResult analyze(String imageUrl) throws Exception {
        log.info("AI 분석 시작: {}", imageUrl);
        byte[] imageBytes = java.net.URI.create(imageUrl).toURL().openStream().readAllBytes();
        log.info("이미지 다운로드 완료: {}bytes", imageBytes.length);
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = imageUrl.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

        Map<String, Object> body = Map.of(
            "contents", new Object[]{
                Map.of("parts", new Object[]{
                    Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64)),
                    Map.of("text", PROMPT)
                })
            }
        );

        log.info("Gemini API 호출 중...");
        String response = restTemplate.postForObject(GEMINI_URL + apiKey, body, String.class);
        log.info("Gemini 응답: {}", response);
        JsonNode root = objectMapper.readTree(response);
        JsonNode parts = root.path("candidates").get(0).path("content").path("parts");
        String json = null;
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isBlank()) {
                json = text;
                break;
            }
        }
        if (json == null) throw new RuntimeException("Gemini 응답에서 텍스트를 찾을 수 없습니다.");

        String cleaned = json.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").strip();
        }

        JsonNode result = objectMapper.readTree(cleaned);
        if ("NOT_FOOD".equals(result.path("error").asText(null))) {
            throw new IllegalArgumentException("음식 사진이 아닙니다. 음식 사진을 등록해주세요.");
        }
        return new FoodAnalysisResult(
                result.path("name").asText(),
                result.path("consumptionDays").asInt(7),
                result.path("nutrition").asText(),
                result.path("tag").asText(null)
        );
    }

    public FoodAnalysisResult analyzeByName(String foodName) throws Exception {
        log.info("이름 기반 AI 분석 시작: {}", foodName);
        String prompt = "'" + foodName + "' 음식에 대해 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.\n" +
                "{\"name\":\"음식이름\",\"consumptionDays\":평균소비일수(숫자),\"nutrition\":\"간단한영양정보\"}";

        Map<String, Object> body = Map.of(
            "contents", new Object[]{
                Map.of("parts", new Object[]{
                    Map.of("text", prompt)
                })
            }
        );

        String response = restTemplate.postForObject(GEMINI_URL + apiKey, body, String.class);
        log.info("Gemini 응답: {}", response);
        JsonNode root = objectMapper.readTree(response);
        JsonNode parts = root.path("candidates").get(0).path("content").path("parts");
        String json = null;
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isBlank()) { json = text; break; }
        }
        if (json == null) throw new RuntimeException("Gemini 응답에서 텍스트를 찾을 수 없습니다.");
        String cleaned = json.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").strip();
        }
        JsonNode result = objectMapper.readTree(cleaned);
        return new FoodAnalysisResult(
                result.path("name").asText(),
                result.path("consumptionDays").asInt(7),
                result.path("nutrition").asText(),
                result.path("tag").asText(null)
        );
    }

    public record FoodAnalysisResult(String name, int consumptionDays, String nutrition, String tag) {}
}
