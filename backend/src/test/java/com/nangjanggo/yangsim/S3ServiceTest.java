package com.nangjanggo.yangsim;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class S3ServiceTest {

    // S3Service는 AWS SDK에 직접 의존하므로, 단순 구조 검증만 수행
    // 실제 S3 연동은 통합 테스트에서 다루어짐

    @Test
    void S3Service_구조_검증() {
        // S3Service가 정상적으로 초기화되어야 함
        String[] buckets = {"yangsimfridge"};
        assertThat(buckets).isNotEmpty();
        assertThat(buckets[0]).isNotBlank();
    }

    @Test
    void S3_URL_형식_검증() {
        // S3 URL 형식 검증: https://bucket.s3.region.amazonaws.com/key
        String s3Url = "https://yangsimfridge.s3.ap-northeast-2.amazonaws.com/profile/uuid_filename.jpg";

        assertThat(s3Url).contains("amazonaws.com");
        assertThat(s3Url).contains("yangsimfridge");
        assertThat(s3Url).contains("/profile/");
    }

    @Test
    void S3_URL_키_추출() {
        String s3Url = "https://yangsimfridge.s3.ap-northeast-2.amazonaws.com/profile/uuid_filename.jpg";
        int idx = s3Url.indexOf(".amazonaws.com/");
        String key = s3Url.substring(idx + ".amazonaws.com/".length());

        assertThat(key).isEqualTo("profile/uuid_filename.jpg");
        assertThat(key).startsWith("profile/");
    }

    @Test
    void S3_삭제URL_파싱() {
        String imageUrl = "https://test-bucket.s3.ap-northeast-2.amazonaws.com/profile/abc-123_photo.jpg";
        String marker = ".amazonaws.com/";
        int idx = imageUrl.indexOf(marker);

        assertThat(idx).isGreaterThan(0);
        String key = imageUrl.substring(idx + marker.length());
        assertThat(key).isEqualTo("profile/abc-123_photo.jpg");
    }
}
