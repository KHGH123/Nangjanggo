# API 구현 현황

---

## 백엔드 (Controller 기준)

### ✅ 구현됨

| 영역 | API |
|------|-----|
| User | POST `/register`, POST `/login` |
| | GET/PUT/DELETE `/mypage`, PUT `/mypage/pwd` |
| | POST `/user/verification/send`, POST `/user/verification/verify` |
| | POST `/user/reset-password` |
| Group | GET/POST `/groups`, PUT/DELETE `/groups/{groupId}` |
| | GET `/groups/{groupId}/members`, PUT `/groups/{groupId}/members/{memberId}` |
| | DELETE `/groups/{groupId}/members` (일괄 강퇴) |
| | POST `/groups/join`, DELETE/PUT `/groups/{groupId}/members/me` |
| Fridge | GET/POST `/groups/{groupId}/fridges` |
| | PUT `/groups/{groupId}/fridges/{fridgeId}` |
| | DELETE `/groups/{groupId}/fridges` (일괄) |
| Food | GET `/groups/{groupId}/foods` |
| | GET `/groups/{groupId}/fridges/{fridgeId}/foods` |
| | GET `/groups/{groupId}/foods/{foodId}` |
| | POST/PUT/DELETE `/groups/{groupId}/users/{userId}/foods` |

### ❌ 미구현

| 영역 | API |
|------|-----|
| User | PUT `/mypage/img` (프로필 이미지) |
| Group | GET `/groups/{groupId}` (단일 조회) |
| | GET `/groups/{groupId}/invite-code` |
| | POST `/groups/{groupId}/verify-code` |
| | GET `/groups/{groupId}/members/{memberId}` (멤버 상세) |
| | DELETE `/groups/{groupId}/members/{memberId}` (단건 강퇴) |
| Fridge | DELETE `/groups/{groupId}/fridges/{fridgeId}` (단건 삭제) |
| Food | DELETE `/foods`, DELETE `/groups/{groupId}/fridges/{fridgeId}/foods` |
| | DELETE `/groups/{groupId}/members/{memberId}/foods` |
| Notification | 전체 (`/api/devices/token`, `/api/notification-settings`, `/api/notifications`) |
| Community | 전체 (게시글/댓글/좋아요) |

### ⚠️ 명세와 다른 것

- `POST /user/forgot-password` → 실제 `/user/reset-password`
- `POST /groups/{groupId}/join` → 실제 `/groups/join` (groupId 없음)
- 음식 추가/수정/삭제: 명세는 `/fridges/{fridgeId}/foods`, 실제는 `/users/{userId}/foods` (fridgeId 경로 없음)

---

## 프론트엔드 (API 파일 기준)

### ✅ 구현됨

| 영역 | 함수 |
|------|-----|
| authApi.js | `login`, `signup`, `getMe`, `delAccount` |
| | `updateProfile`, `updatePassword` |
| | `sendEmailCode`, `verifyEmailCode`, `submitPasswordReset` |
| groupApi.js | `getMyGroups`, `createGroup`, `joinGroup` |
| notificationApi.js | `registerPushToken`, `deletePushToken` |
| | `getNotificationSettings`, `updateNotificationSettings` |

### ❌ 미구현

| 영역 | 없는 함수 |
|------|---------|
| authApi.js | 프로필 이미지 변경 (`PUT /mypage/img`) |
| groupApi.js | 그룹 단일 조회, 수정, 삭제 |
| | 초대 코드 생성/검증 |
| | 멤버 조회/상세/수정/삭제 |
| | 그룹 탈퇴 |
| fridgeApi.js | **파일 전체 비어있음** (냉장고 CRUD 전무) |
| foodApi.js | **파일 자체 없음** (음식 CRUD 전무) |
| notificationApi.js | 알림 목록 조회 (`GET /api/notifications`) |
| communityApi.js | **파일 자체 없음** (게시글/댓글/좋아요 전무) |
