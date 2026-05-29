# 알림

### REST API 엔드포인트 (총 9개)

### 디바이스 토큰

`POST   /notifications/token          → FCM 토큰 등록 (로그인 시)
DELETE /notifications/token          → FCM 토큰 삭제 (로그아웃/탈퇴 시)`

`// POST body
{ "token": "ExponentPushToken[xxxxxx]" }`

### 알림 설정

`GET   /notifications/settings   → 설정 조회
PATCH /notifications/settings   → 설정 변경 (변경 필드만 전송)`

`// GET response / PATCH body
{
  "pushEnabled": true,
  "expiryAlertEnabled": true,
  "sharedPurchaseAlertEnabled": true,
  "boardAlertEnabled": true
}`

### 알림 목록

`GET    /notifications              → 내 알림 목록 (최신순)
GET    /notifications/unread-count → 읽지 않은 알림 수
PATCH  /notifications/{id}/read   → 단건 읽음 처리
DELETE /notifications/{id}        → 단건 삭제
DELETE /notifications             → 전체 삭제`

---

### GET /notifications 응답 필드

`[
  {
    "id": 1,
    "type": "NOTICE_CREATED",
    "title": "새 공지사항이 등록되었습니다",
    "content": "이번 주 금요일부터 냉장고 정리를 시작합니다.",
    "isRead": false,
    "groupId": 3,
    "relatedEntityId": 12,
    "createdAt": "2026-05-20T08:00:00"
  }
]`

`GET /notifications/unread-count response
{ "count": 3 }`

---

### 알림 type 6종 & 발송 시점

| type | 발송 시점 | 설정 연동 |
| --- | --- | --- |
| `GROUP_KICKED` | 관리자가 멤버 추방 시 | `pushEnabled`만 |
| `GROUP_PROMOTED` | 관리자가 멤버 승격 시 | `pushEnabled`만 |
| `EXPIRY_SOON` | 매일 오전 8시 스케줄러, 소비기한 1일 남은 음식 | `expiryAlertEnabled` |
| `NOTICE_CREATED` | 관리자가 공지 등록 시 | `boardAlertEnabled` |
| `CLAIM_SUCCESS` | 찜한 음식의 소유권이 나에게 넘어올 때 (자정 스케줄러) | `sharedPurchaseAlertEnabled` |
| `CLAIM_FAILED` | 원소유자가 찜 대기 중 음식을 소비/폐기/기한 연장 시 | `sharedPurchaseAlertEnabled` |

---

### Expo Push 발송 payload (알림 data 필드)

백엔드가 Expo Push API로 보낼 때 `data` 필드에 반드시 포함해야 해요. 프론트가 탭 시 화면 이동에 사용해요.

`{
  "to": "ExponentPushToken[xxxxxx]",
  "title": "새 공지사항이 등록되었습니다",
  "body": "이번 주 금요일부터 냉장고 정리를 시작합니다.",
  "data": {
    "type": "NOTICE_CREATED",
    "groupId": 3,
    "relatedEntityId": 12
  }
}`

---

### 화면 이동 매핑 (프론트 기준)
| type | 이동 화면 |
| --- | --- |
| `NOTICE_CREATED` | Notice 화면 (`groupId`, `noticeId` 전달) |
| `GROUP_PROMOTED` | GroupHomeScreen (`groupId`) |
| `GROUP_KICKED` | 이동 없음 (그룹에서 쫓겨난 상태) |
| `EXPIRY_SOON` | GroupHomeScreen (`groupId`) |
| `CLAIM_SUCCESS` | GroupHomeScreen (`groupId`) |
| `CLAIM_FAILED` | GroupHomeScreen (`groupId`) |