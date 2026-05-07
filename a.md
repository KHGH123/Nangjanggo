# API 명세서

---

# User

## 회원가입
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/register` | `{ email:String, password:String, name:String, isActive:boolean=true, createdAt:Date }` | 회원가입 정보 전송 |

## 로그인
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/login` | `{ email:String, password:String }` | 로그인 정보 전송 |

## 이메일 인증 코드 발송
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/user/verification/send` | `{ email:String, type:"REGISTER" \| "PASSWORD_RESET" }` | 인증 코드 발송 |

## 이메일 인증 코드 검증
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/user/verification/verify` | `{ email:String, code:String }` | 인증 코드 검증 |

## 비밀번호 찾기
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/user/forgot-password` | - | 비밀번호 재설정 요청 |

---

# 마이페이지

## 내 정보 조회
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/mypage` | `{ email, name, profileImageUrl }` | 내 정보 불러오기 |

## 프로필 이미지 변경
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/mypage/img` | Multipart File | 프로필 이미지 변경 |

## 이름/이메일 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/mypage` | `{ name, email }` | 이름 및 이메일 변경 |

## 비밀번호 변경
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/mypage/pwd` | `{ currentPassword, newPassword }` | 비밀번호 변경 |

## 회원 탈퇴
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/mypage` | 회원 탈퇴 |

---

# Group

## 그룹 목록 조회
| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/groups` | `?groupName=String&sort=name,asc` | `groupId, groupName, memberCount, isAdmin, joinDate, leaveDate` |

## 그룹 생성
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/groups` | `{ groupName, nickname, sharedSchedule, description, period, createdBy, createdAt, joinDate, leaveDate }` | 그룹 생성 |

## 그룹 단일 조회
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/groups/{groupId}` | `{ groupName, periodDate, joinDate, leaveDate, createdBy }` | 그룹 상세 조회 |

## 그룹 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/groups/{groupId}` | `{ groupName, description, period }` | 관리자 그룹 수정 |

## 그룹 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/groups/{groupId}` | 관리자 그룹 삭제 |

---

# Group Members

## 그룹 멤버 조회
| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/groups/{groupId}/members` | `?nickname=String&sort=name,desc` | `memberId, nickname, role, joinDate, leaveDate, profileImg` |

## 초대 코드 생성
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/groups/{groupId}/invite-code` | `{ code:String }` | 초대 코드 생성 |

## 초대 코드 검증
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/groups/{groupId}/verify-code` | `{ code:String }` | 초대 코드 검증 |

## 그룹 참여
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/groups/{groupId}/join` | `{ joinDate, leaveDate, nickname }` | 그룹 참여 |

## 멤버 상세 조회
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/groups/{groupId}/members/{memberId}` | `{ memberId, nickname, role, joinDate, leaveDate, profileImg }` | 멤버 상세 조회 |

## 멤버 정보 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/groups/{groupId}/members/{memberId}` | `{ role, nickname }` | 관리자 권한 수정 / 사용자 닉네임 수정 |

## 멤버 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/groups/{groupId}/members/{memberId}` | 관리자 강퇴 / 사용자 탈퇴 |

## 멤버 일괄 삭제
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/groups/{groupId}/members` | `?confirmAll=true` 또는 `{ "memberIds":[1,2] }` | 멤버 전체/선택 삭제 |

---

# Fridge

## 냉장고 목록 조회
| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/groups/{groupId}/fridges` | `?fridgeName=String&sort=String` | `fridgeId, fridgeName` |

## 냉장고 생성
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/groups/{groupId}/fridges` | `{ fridgeName }` | 냉장고 추가 |

## 냉장고 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/groups/{groupId}/fridges/{fridgeId}` | `{ fridgeName }` | 냉장고 이름 변경 |

## 냉장고 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/groups/{groupId}/fridges/{fridgeId}` | 냉장고 삭제 |

## 냉장고 일괄 삭제
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/groups/{groupId}/fridges` | `?confirmAll=true` 또는 `{ "fridgeIds":[1,2] }` | 냉장고 전체/선택 삭제 |

---

# Food

## 그룹 전체 음식 조회
| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/groups/{groupId}/foods` | `?status=ENUM&memberId=Long&sort=String` | `foodId, status, quantity, storedDate, expirationDate, ownerId, ownerNickname` |

> 관리자: 전체 조회 가능  
> 사용자: 본인 음식 + 공용 음식(SHARED, CANDIDATE) 조회 가능

## 특정 냉장고 음식 조회
| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/groups/{groupId}/fridges/{fridgeId}/foods` | `?status=ENUM&memberId=Long&sort=String` | `foodId, status, quantity, storedDate, expirationDate, ownerId, ownerNickname` |

## 음식 추가
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/groups/{groupId}/fridges/{fridgeId}/foods` | `{ quantity, memo, status }` | 음식 추가 |

### status ENUM
- `PRIVATE`
- `CANDIDATE`
- `SHARED`
- `EXPIRING`
- `CONSUMED`

## 음식 상세 조회
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/foods/{foodId}` | `{ quantity, memo, status }` | 음식 상세 조회 |

## 음식 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/foods/{foodId}` | `{ fridgeId, quantity, memo, status, ownerId, ownerNickname }` | 음식 정보 수정 |

## 음식 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/foods/{foodId}` | 특정 음식 삭제 |

## 음식 다중 삭제
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/foods` | `{ "foodIds":[1,2,3] }` | 여러 음식 삭제 |

## 특정 냉장고 음식 비우기
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/groups/{groupId}/fridges/{fridgeId}/foods` | `?confirmAll=true` 또는 `{ "foodIds":[1,2] }` | 음식 전체/선택 삭제 |

## 특정 멤버 음식 삭제
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/groups/{groupId}/members/{memberId}/foods` | `?confirmAll=true` 또는 `{ "foodIds":[1,2] }` | 특정 멤버 음식 삭제 |

---

# Notification

## 디바이스 토큰 등록
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/api/devices/token` | `{ token:"ExponentPushToken[xxxxxx]" }` | 푸시 토큰 등록 |

## 디바이스 토큰 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/api/devices/token` | 로그아웃/회원탈퇴 시 토큰 삭제 |

## 알림 설정 조회
| Method | Endpoint | Response | Description |
|---|---|---|---|
| GET | `/api/notification-settings` | `{ pushEnabled }` | 알림 설정 조회 |

## 알림 설정 변경
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PATCH | `/api/notification-settings` | `{ pushEnabled:boolean }` | 알림 설정 변경 |

## 알림 목록 조회
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | 알림 목록 조회 |

---

# Community

## 게시글 작성
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/posts` | `{ userId, groupId, title, context, postType, createdAt }` | 게시글 작성 |

## 게시글 목록 조회
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts` | 게시글 목록 조회 |

## 게시글 상세 조회
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts/{postId}` | 게시글 상세 조회 |

## 게시글 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/posts/{postId}` | `{ postId, userId, title, context, createdAt }` | 게시글 수정 |

## 게시글 삭제
| Method | Endpoint | Request | Description |
|---|---|---|---|
| DELETE | `/posts/{postId}` | `{ postId }` | 게시글 삭제 |

---

# Comment

## 댓글 목록 조회
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts/{postId}/comments` | 댓글 목록 조회 |

## 댓글 작성
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/posts/{postId}/comments` | `{ postId, userId, context, createdAt }` | 댓글 작성 |

## 댓글 수정
| Method | Endpoint | Request | Description |
|---|---|---|---|
| PUT | `/comments/{commentId}` | `{ commentId, userId, context, updatedAt }` | 댓글 수정 |

## 댓글 삭제
| Method | Endpoint | Description |
|---|---|---|
| DELETE | `/comments/{commentId}` | 댓글 삭제 |

---

# Like

## 게시글 좋아요
| Method | Endpoint | Request | Description |
|---|---|---|---|
| POST | `/posts/{postId}/like` | `{ userId }` | 게시글 좋아요 |

---

# Hardware

> 추후 정의 예정