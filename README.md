# Nangjanggo (냉장고)

구성원 모두가 함께 관리하는 스마트 냉장고 앱

## 프로젝트 소개

관리자 혼자가 아닌 그룹 구성원 모두가 함께 냉장고를 관리하는 모바일 앱입니다.  
초대 코드로 그룹에 참여하면 냉장고 식재료 등록부터 유통기한 관리까지 모든 구성원이 직접 참여할 수 있습니다.  
유통기한이 임박한 식재료는 다른 구성원이 찜해서 가져갈 수 있고, 관리에 참여하면 포인트를 받을 수 있습니다.

**주요 기능**

- 그룹 기반 냉장고 공동 관리 (관리자 + 구성원 모두 참여)
- 식재료 등록 / 수정 / 삭제 및 유통기한 알림
- 유통기한 임박 식재료 찜하기 / 공유 전환
- 포인트 & 랭킹 시스템으로 참여 독려
- 라즈베리파이 + 라벨 프린터로 식재료 라벨 자동 출력
- 커뮤니티 (게시글 / 댓글 / 좋아요)
- 푸시 알림

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React Native, Expo |
| Backend | Spring Boot 3.4.4, Java 21 |
| Database | MySQL 8.0 |
| Auth | Spring Security, JWT |
| Storage | AWS S3 |
| AI | Google Gemini API |
| Push | Firebase, Expo Notifications |
| Infra | Docker, AWS Lambda |
| CI/CD | GitHub Actions |
| Hardware | Raspberry Pi, 라벨 프린터, NFC |

---

## 하드웨어 구성

**Raspberry Pi + 라벨 프린터**를 냉장고에 연동해, 식재료 등록 시 자동으로 라벨을 출력합니다.

**라벨 출력 흐름**

```
모바일 앱에서 NFC 태그 터치
        │
        ▼
Spring Boot 서버 (EC2)
  - 음식 항목 생성
  - Raspberry Pi로 출력 명령 전송 (Cloudflare Tunnel)
        │
        ▼
Raspberry Pi → 라벨 프린터
  - 출력 내용: 음식 ID / 소유자 / 보관 기간
  - QR 코드: 앱 딥링크 (yangsimfridge://foods/{id})
```

---

## 프로젝트 구조

```
Nangjanggo/
├── backend/                        # Spring Boot 서버
│   └── src/main/java/com/nangjanggo/yangsim/
│       ├── user/                   # 회원가입, 로그인, 마이페이지
│       ├── group/                  # 그룹 생성/참여/멤버 관리
│       ├── fridge/                 # 냉장고 CRUD
│       ├── food/                   # 식재료 CRUD, AI 분석
│       ├── hardware/               # 라즈베리파이 연동
│       ├── printer/                # 라벨 프린터 출력
│       ├── notification/           # 푸시 알림
│       ├── community/              # 게시글, 댓글, 좋아요
│       ├── ranking/                # 랭킹 및 포인트
│       └── security/               # JWT 인증
│
├── frontend/                       # React Native 앱 (Expo)
│   └── src/
│       ├── core/
│       │   ├── navigation/         # 앱 라우팅
│       │   └── providers/          # 전역 Context
│       ├── features/
│       │   ├── auth/               # 로그인, 회원가입, 비밀번호 재설정
│       │   ├── group/              # 그룹 관리, NFC 태그 쓰기
│       │   ├── fridge/             # 냉장고 및 식재료 화면, NFC 읽기
│       │   ├── food/               # 음식 등록, QR 스캔
│       │   ├── community/          # 게시글, 댓글
│       │   ├── notification/       # 알림 목록
│       │   ├── mypage/             # 내 정보 수정
│       │   └── home/               # 홈 화면
│       └── shared/                 # 공통 컴포넌트, 상수, 유틸
│
└── (Hardware) Raspberry Pi         # 라즈베리파이 (별도 레포)
    ├── 라벨 프린터 제어 서버 (HTTP)
    ├── Cloudflare Tunnel로 외부 접속 허용
    └── NFC 태그 → 앱 딥링크 연동
```

---

## 아키텍처

**Client**
```
React Native + Expo (Android / iOS)
  ├── Firebase        — 푸시 알림
  └── REST API 통신  — Spring Boot 서버
```

**Server**
```
Spring Boot API Server (Docker, EC2)
  ├── MySQL 8.0       — 데이터 저장
  ├── AWS S3          — 이미지 저장
  ├── Google Gemini   — 식재료 AI 분석
  └── Raspberry Pi    — 라벨 프린터 제어 (Cloudflare Tunnel)
```

**CI/CD**
```
GitHub Actions
  ├── Backend  → Docker 이미지 빌드 → Docker Hub → EC2 배포
  └── Frontend → Expo EAS 빌드 → Google Play Store
```

---

## 시작하기

### 사전 요구사항

- Java 21
- Node.js 18+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 환경 변수

`backend/.env`

```env
# MySQL
DB_USERNAME=
DB_PASSWORD=
DB_ROOT_PASSWORD=

# JWT 서명 키
JWT_SECRET=

# Gmail SMTP (이메일 인증 발송)
MAIL_USERNAME=
MAIL_PASSWORD=

# AWS S3 (이미지 저장)
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Google Gemini (식재료 AI 분석)
GEMINI_API_KEY=
```

`frontend/.env`

```env
# 백엔드 서버 주소
EXPO_PUBLIC_API_URL=
```

### 백엔드 실행

```bash
cd backend
docker-compose up --build
```

또는 로컬에서 직접 실행:

```bash
cd backend
./gradlew bootRun
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npx expo start
```

---

## 팀원

| 학과 | 학번 | 이름 | 역할 |
|------|------|------|------|
| 소프트웨어학과 | 202020739 | 이기훈 (팀장) | Backend |
| 수학과 | 202127325 | 서지원 | Backend |
| 소프트웨어학과 | 202126839 | 김도형 | Frontend |
| 소프트웨어학과 | 202126861 | 김영빈 | Frontend |
