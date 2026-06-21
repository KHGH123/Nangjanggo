<div align="center">
  
  <p align="center">
    <img src="https://github.com/Nangjanggo/Nangjanggo/blob/main/frontend/assets/splash_screen_3.png" alt="yangsimfridge" width="128" />
  </p>
  
  # 양심냉장고
  ### 공용 냉장고 관리 서비스
  
</div>

---

## 목차
- [서비스 개요](#서비스-개요)
- [서비스 상세 소개](#서비스-상세-소개)
  - [핵심 기능](#핵심-기능)
  - [사용자 시나리오](#사용자-시나리오)
- [설계 및 구현](#설계-및-구현)
  - [소프트웨어 아키텍처](#소프트웨어-아키텍처)
  - [Repository 구조](#repository-구조)
  - [핵심 기술 스택](#핵심-기술-스택)
  - [하드웨어 구성](#하드웨어-구성)
  - [시작하기](#시작하기)
  - [DevSecOps, 배포](#devsecops-배포)
- [팀원 소개](#팀원-소개)

---

## 서비스 개요
> ‘양심 냉장고’는 공동체 내 공용 냉장고의 효율적인 관리를 돕는 어플리케이션입니다.
> 
> 사용자는 NFC 태그를 통해 편하게 라벨 스티커를 출력하여 상품에 붙이고, 관리자는 라벨의 QR코드로 음식의 상태를 확인합니다.
> 
> 또, 음식 폐기 과정에서 공동체 구성원의 자발적 참여를 유도하여 관리자의 부담을 분산시킵니다.
#
| 구분 | 내용 |
| --- | --- |
| **Target** | **다중 이용 시설 내 공용 냉장고 운영 관리자** <br>&nbsp;- 대학 기숙사 운영 교직원 및 사감 <br>&nbsp;- 공유 주거 및 오피스 플랫폼 운영 주체 |
| **Problem** | - 관리자가 냉장고 속 식품의 **상태를 파악**하기 어려움<br>- 냉장고 이용자들에게 **필요한 공지사항을 전달**하기 어려움<br>- 오래된 음식과 같이 **버려야 할 음식 관리**의 어려움 |
| **Solution** | - **그룹을 생성하고 냉장고를 추가**하여 효율적인 그룹 내 공용 냉장고 관리<br>- **NFC 태그와 라벨 프린터기**를 이용한 식품 등록<br>- **QR 코드 스캔**을 통한 빠른 식품 상태 확인 |

---

## 서비스 상세 소개

### 핵심 기능

**1. 그룹 생성**
  <p align="center">
    <img width="250" alt="KakaoTalk_20260527_174243205_04" src="https://github.com/user-attachments/assets/7c9810be-6f7e-4049-ab58-6630b7231bf9" />
    <img width="250" alt="KakaoTalk_20260527_174243205_18" src="https://github.com/user-attachments/assets/929f00c3-36ff-4ab5-b4d6-5b3dddd7a356" />
  </p>
  
  - 사용자는 누구나 그룹을 생성할 수 있습니다.
  - 보관기한, 입/퇴실일을 설정할 수 있습니다.
  - 그룹을 만든 사용자는 해당 그룹의 관리자가 됩니다.
  - 그룹 생성 시 자동 설정되는 초대 코드를 통해 다른 사용자들이 그룹에 참여할 수 있습니다.
  - 관리자는 그룹 내 공지 게시판을 통해 그룹원에게 중요한 메시지를 전달할 수 있습니다.
#
**2. 음식 저장**
   <p align="center">
     <img width="250" alt="KakaoTalk_20260527_192900772_03" src="https://github.com/user-attachments/assets/8d503837-ad47-4439-b103-0bdb226b0145" />
     <img width="250" alt="KakaoTalk_20260527_192900772_06" src="https://github.com/user-attachments/assets/d9c75930-27ff-4904-87ba-dc1a0a6a85ab" />
   </p>

   - 사용자는 새로운 음식을 저장하기 위해 냉장고에 부착된 NFC 스티커에 휴대전화를 태깅합니다.
   - 앱과 라즈베리파이가 연동하여 라벨 프린터에서 사용자와 유효기간, 상태 확인 용 QR코드가 포함된 스티커가 출력됩니다.
   - 사용자는 자신의 식품에 스티커를 부착하고 냉장고에 보관합니다.
   - 라벨 출력이 완료된 후, 음식 상세 정보 저장 페이지를 확인할 수 있습니다.
   - 사진을 첨부하고 음식 이름과 내용 및 수량을 작성 후 저장할 수 있습니다.
   - 사진을 첨부한 후, AI로 상세 정보를 채워 넣을 수 있습니다.
#  
**3. 상태 확인**
  <p align="center">
    <img width="250" alt="KakaoTalk_20260527_193247420" src="https://github.com/user-attachments/assets/cf645f13-7554-40b9-92ab-ffa796c7d8ae" />
    <img width="250" alt="KakaoTalk_20260527_192900772_07" src="https://github.com/user-attachments/assets/3c320378-f7c7-4de4-8fd9-700c3ebe18aa" />
  </p>

  - 관리자는 앱 내에서 QR코드 촬영 버튼을 누르고, 라벨 스티커에 포함된 QR코드를 촬영할 수 있습니다.
  - 카메라 하단에는 소유주, 음식 상태, 등록 일자와 마감 일자 등이 표시됩니다.
  - 색깔을 이용한 직관적인 UI로 빠르게 상태를 확인하고, 음식물을 처리할 수 있습니다.
#
**4. 포인트 & 찜**
  <p align="center">
    <img width="250" alt="KakaoTalk_20260529_010111483_01" src="https://github.com/user-attachments/assets/44652354-a1e5-4ac5-9233-b30911d7f526" />
    <img width="250" alt="KakaoTalk_20260529_010230508" src="https://github.com/user-attachments/assets/4a8ec339-4452-4eda-852a-217100b72992" />
  </p>

  - 유효기간이 지난 음식은 폐기되기 전 공용상품으로 전환됩니다.
  - 사용자들이 공용 카테고리에 올라와 있는 음식을 먹을 수 있도록 하여 폐기되는 음식을 최소화 합니다.
  - 사용자는 포인트를 이용하여 다른 사용자들의 폐기 예정 음식을 찜할 수 있습니다.
  - 폐기 예정 음식이란 유효 기간이 하루 남은 음식을 의미하며, 음식의 원래 주인이 유효기간 내에 자신의 음식을 처리하지 않는다면 음식의 소유권이 찜한 사용자에게 넘어갑니다.
  - 포인트 제도를 통해 사용자들의 적극적인 참여를 유도합니다.
#
### 사용자 시나리오
사용자 시나리오

---

## 설계 및 구현

### 소프트웨어 아키텍처
<p align="center">
  <img width="500" alt="26-1캡디_시스템구성도 drawio의 사본 drawio" src="https://github.com/user-attachments/assets/91c93bef-5b7a-4537-9190-8a1beed158b1" />
</p>

- **Presentation Layer**
  - **App (Root Component)** : 모바일 애플리케이션의 진입점으로, 전체 화면 구조와 전역 상태를 관리
  - **Navigation Module** : 화면 간 이동 및 내비게이션 흐름을 관리
  - **Auth Module** : 로그인/회원가입 처리, JWT 저장 및 인증 상태 관리
  - **Fridge Module** : 식품 목록 조회, 등록, 삭제 기능 제공
  - **Group Management Module** : Owner 중심으로 그룹 생성, 그룹 정보 관리, 멤버 관리 기능을 제공
  - **Notification Module** : 알림 목록 조회 및 UI 표시 기능을 제공
  - **API Service Module** : 백엔드와의 HTTP 통신 담당
  - **NFC Module** : NFC 태그 인식 및 특정 냉장고 컨텍스트로의 진입 기능을 제공
  - **Print Status UI Module** : 출력 요청, 출력 완료, 실패 상태를 사용자에게 표시

- **Business Layer**
  - **Auth Service** : 사용자 인증, JWT 발급 및 검증 기능을 담당
  - **User/Group Service** : 사용자 정보 관리, 그룹 생성, 그룹 정보 조회 및 멤버 관리 기능을 담당
  - **Food/Fridge Service** : 식품 등록, 조회, 삭제 및 냉장고 관련 핵심 비즈니스 로직을 처리
  - **Notification Service** : 알림 생성 및 FCM 연동을 통한 푸시 알림 전송을 담당
  - **Print Service** : 식품 등록 시 라벨 출력 요청 생성, 출력 상태 관리, 재출력 기능을 담당
  - **Device Integration Service** : MQTT, Raspberry Pi, 블루투스 라벨 프린터 등 외부 장치와의 연동 로직을 담당

- **Persistence Layer**
  - **User Repository** : 사용자 데이터 접근 및 CRUD를 담당
  - **Group Repository** : 그룹 데이터 접근 및 CRUD를 담당
  - **Food Repository** : 식품 데이터 접근 및 CRUD를 담당
  - **Fridge Repository** : 냉장고 데이터 접근 및 CRUD를 담당
  - **Notification Repository** : 알림 데이터 접근 및 CRUD를 담당
  - **PrintJob Repository** : 라벨 출력 요청 이력과 상태 데이터 접근을 담당

- **Data / External Integration Layer**
  - **MySQL** : 사용자, 그룹, 식품, 알림, 출력 요청 등 서비스 운영 데이터를 저장
  - **AWS S3 Storage** : 식품 이미지, 프로필 이미지 등 업로드 파일을 저장
  - **Firebase Cloud Messaging** : 사용자 디바이스에 푸시 알림을 전송
  - **MQTT Broker** : 백엔드와 라즈베리파이 간의 비동기 메시지 송수신을 담당
  - **Raspberry Pi Gateway** : 서버의 출력 명령을 수신하여 블루투스 라벨 프린터에 전달하는 중간 장치 역할을 수행
  - **Bluetooth Label Printer Interface** : 등록자, 생성 시각, 식별자 등의 정보를 포함한 라벨을 실물로 출력

#
### Repository 구조

```
Nangjanggo/
├── .github/workflows/                  # GitHub Actions CI/CD 설정
│   ├── backend.yml                     # 백엔드 자동 배포 워크플로우
│   └── frontend.yml                    # 프론트엔드 자동 배포 워크플로우
│
├── backend/                            # Spring Boot 백엔드 서버
│   └── src/
│       ├── main/
│       │   ├── java/com/nangjanggo/yangsim/
│       │   │   ├── admin/              # 관리자 기능
│       │   │   ├── auth/               # 로그인, 인증 관련 기능
│       │   │   ├── community/          # 게시글, 댓글, 좋아요
│       │   │   ├── dev/                # 개발 및 테스트용 기능
│       │   │   ├── exception/          # 예외 처리
│       │   │   ├── food/               # 음식 정보 관리
│       │   │   ├── fridge/             # 냉장고 관리 기능
│       │   │   ├── group/              # 그룹 생성 및 멤버 관리
│       │   │   ├── hardware/           # 하드웨어 연동 기능
│       │   │   ├── notification/       # 알림 기능
│       │   │   ├── printer/            # 라벨 프린터 연동 기능
│       │   │   ├── ranking/            # 랭킹 및 포인트 관련 기능
│       │   │   ├── security/           # JWT 인증
│       │   │   ├── user/               # 회원가입, 로그인, 마이페이지
│       │   │   ├── AppConfig.java      # 애플리케이션 설정
│       │   │   └── YangsimApplication.java
│       │   └── resources/              # 설정 파일 및 리소스
│       └── test/
│           ├── java/com/nangjanggo/yangsim/
│           │   └── ...                 # 서비스 및 컨트롤러 테스트 코드
│           └── resources/              # 테스트 리소스
│
├── frontend/                           # React Native / Expo 모바일 앱
│   ├── .expo/                          # Expo 설정 및 캐시
│   ├── android/                        # Android 네이티브 빌드 파일
│   ├── assets/                         # 이미지, 아이콘 등 정적 리소스
│   ├── src/                            # 프론트엔드 주요 소스 코드
│   │   ├── core/navigation/            # 앱 전체 네비게이션 설정
│   │   │   ├── AppNavigator.js
│   │   │   ├── AuthNavigator.js
│   │   │   ├── MainNavigator.js
│   │   │   └── navigationRef.js
│   │   │
│   │   ├── features/                   # 기능별 화면 및 로직
│   │   │   ├── admin/                  # 관리자 기능
│   │   │   ├── auth/                   # 로그인, 회원가입 등 인증 기능
│   │   │   ├── community/              # 커뮤니티 기능
│   │   │   ├── dev/                    # 개발 및 테스트용 기능
│   │   │   ├── food/                   # 음식 정보 관련 기능
│   │   │   ├── fridge/                 # 냉장고 관리 기능
│   │   │   ├── group/                  # 그룹 생성 및 참여 기능
│   │   │   ├── home/                   # 홈 화면 기능
│   │   │   ├── mypage/                 # 마이페이지 기능
│   │   │   └── notification/           # 알림 기능
│   │   │
│   │   └── shared/                     # 공통으로 사용되는 코드
│   │       ├── components/             # 공통 컴포넌트
│   │       ├── constants/              # 상수 관리
│   │       └── utils/                  # 공통 유틸 함수
│   │
│   ├── app.config.js                   # Expo 앱 설정
│   ├── App.js                          # 앱 진입점 컴포넌트
│   ├── babel.config.js                 # Babel 설정
│   ├── eas.json                        # EAS Build 설정
│   ├── index.js                        # React Native 진입 파일
│   ├── jsconfig.json                   # JavaScript 경로 설정
│   ├── metro.config.js                 # Metro 번들러 설정
│   ├── package.json                    # 프로젝트 의존성 및 스크립트
│   └── package-lock.json               # 의존성 버전 고정 파일
├── docs4capstone/                      # 캡스톤 관련 문서
└── .gitignore                          # Git 추적 제외 파일 설정


(Hardware) Raspberry Pi                 # 라즈베리파이 기반 하드웨어 모듈, 별도 레포지토리
├── Label Printer Control Server        # HTTP 기반 라벨 프린터 제어 서버
├── Cloudflare Tunnel                   # 외부 접속을 위한 터널링 설정
└── NFC Tag Deep Link                   # NFC 태그를 통한 앱 딥링크 연동
```

#
### 핵심 기술 스택
**시스템 구성도**
<p align="center">
  <img width="500" alt="(New2)26-1캡디_시스템구성도 drawio의 사본 drawio" src="https://github.com/user-attachments/assets/a7003523-eba9-480b-8451-6a5a0842bc31" />
</p>

- **Mobile App**: React Native / Expo 기반 앱으로, NFC 태깅을 통한 식품 등록 및 보관 기한 알림 제공
- **Backend Server**: Spring Boot 기반 REST API 서버로, 사용자·그룹·냉장고·식품·라벨 데이터 관리
- **IoT Devices**: Raspberry Pi, NFC, 라벨 프린터를 활용한 식품 등록 및 라벨 출력 연동
- **External Services**: AWS S3, FCM, Gemini API를 활용한 이미지 저장, 푸시 알림, 식품 정보 자동 생성
 
| 영역 | 기술 | 선정이유 |
| --- | --- | --- |
| Frontend | React Native, Expo | 하나의 코드베이스로 모바일 앱을 개발할 수 있으며, Expo를 통해 빌드와 테스트 과정을 간소화할 수 있음 |
| Backend | Spring Boot 3.4.4, Java 21 | 안정적인 서버 구조와 REST API 개발에 적합하며, 인증·DB 연동·배포 환경 구성이 용이함 |
| Database | MySQL 8.0 | 사용자, 그룹, 식품, 냉장고 데이터처럼 관계형 데이터 관리에 적합하고 안정성이 높음 |
| Auth | Spring Security, JWT | 사용자 인증과 권한 관리를 체계적으로 구현할 수 있으며, JWT를 통해 모바일 환경에서 상태 없는 인증 처리가 가능함 |
| Storage | AWS S3 | 식품 이미지와 같은 파일 데이터를 서버와 분리하여 안정적으로 저장하고 관리할 수 있음 |
| AI | Google Gemini API | 식품 정보 분석 및 자동 생성 기능을 구현하여 사용자의 입력 부담을 줄일 수 있음 |
| Push | Firebase, Expo Notifications | 식품 유통기한, 냉장고 상태, 그룹 알림 등을 모바일 앱 사용자에게 실시간으로 전달할 수 있음 |
| Infra | Docker, AWS EC2 | Docker를 통해 실행 환경을 일관되게 관리하고, AWS EC2를 활용해 백엔드 서버를 클라우드 환경에서 운영할 수 있음 |
| CI/CD | GitHub Actions | 코드 변경 시 빌드 및 배포 과정을 자동화하여 수동 배포의 오류를 줄이고 개발 효율을 높일 수 있음 |
| Hardware | Raspberry Pi, 라벨 프린터, NFC | NFC 태그와 라벨 프린터를 활용해 식품 등록 및 식별 과정을 오프라인 환경과 연동 가능 |

#
### 하드웨어 구성

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

#
### 시작하기
#### 사전 요구사항

- Java 21
- Node.js 18+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

#### 환경 변수

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

#### 백엔드 실행

```bash
cd backend
docker-compose up --build
```

또는 로컬에서 직접 실행:

```bash
cd backend
./gradlew bootRun
```

#### 프론트엔드 실행

```bash
cd frontend
npm install
npx expo start
```

#
### DevSecOps, 배포
#### CI/CD 파이프라인
본 프로젝트는 GitHub Actions를 활용하여 백엔드 서버의 빌드 및 배포 과정을 자동화하였습니다. 코드가 GitHub 저장소에 반영되면 워크플로우가 실행되고, 백엔드 애플리케이션을 빌드한 뒤 Docker 이미지 기반으로 서버에 배포되도록 구성하였습니다.

```text
코드 변경 및 Push
└── GitHub Actions 실행
    ├── 백엔드 프로젝트 빌드
    ├── Docker 이미지 생성 및 갱신
    ├── EC2 서버 접속
    └── Docker Compose를 통한 컨테이너 재실행
```

이를 통해 수동으로 서버에 접속하여 배포하는 과정을 줄이고, 배포 절차를 일정하게 유지할 수 있도록 하였습니다.

#### 백엔드 배포 환경
백엔드 배포

#### 모바일 앱 빌드
프론트엔드는 React Native / Expo 기반 모바일 앱으로 개발하였으며, 별도의 웹 서버 배포가 아닌 EAS Build를 통한 Android 앱 빌드 방식으로 테스트하였습니다. 생성된 APK 파일을 실제 Android 기기에 설치하여 NFC 태깅, 식품 등록, 알림, QR 스캔 등 주요 기능을 검증하였습니다.

#### 하드웨어 연동 배포
하드웨어

#### 보안
보안

---

## 팀원 소개

| 학과 | 학번 | 이름 | 역할 |
|------|------|------|------|
| 소프트웨어학과 | 202020739 | 이기훈 (팀장) | Backend |
| 수학과 | 202127325 | 서지원 | Backend |
| 소프트웨어학과 | 202126839 | 김도형 | Frontend |
| 소프트웨어학과 | 202126861 | 김영빈 | Frontend |
