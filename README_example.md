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
- [설계 및 구현](#설계-및-구현)
  - [소프트웨어 아키텍쳐](#소프트웨어-아키텍쳐)
  - [리포지토리 구조](#리포지토리-구조)
  - [핵심 기술 스택](#핵심-기술-스택)
  - [DevOps, 배포](#devops-배포)
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
ㅇ

---

## 설계 및 구현

### 소프트웨어 아키텍쳐
12

### 리포지토리 구조

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
│       │   │   ├── admin/              # 
│       │   │   ├── auth/               # 
│       │   │   ├── community/          # 게시글, 댓글, 좋아요
│       │   │   ├── dev/                # 
│       │   │   ├── exception/          # 
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

### 핵심 기술 스택
12

### DevOps, 배포
12

---

## 팀원 소개

| 학과 | 학번 | 이름 | 역할 |
|------|------|------|------|
| 소프트웨어학과 | 202020739 | 이기훈 (팀장) | Backend |
| 수학과 | 202127325 | 서지원 | Backend |
| 소프트웨어학과 | 202126839 | 김도형 | Frontend |
| 소프트웨어학과 | 202126861 | 김영빈 | Frontend |
