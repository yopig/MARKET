# 🐾 Pet-topia: 우리 동네 반려동물 정보 플랫폼 🐾

**🌐 Live Demo: http://13.124.132.168:8080/**

---

## 💡 프로젝트 소개

우리 동네 반려동물을 위한 모든 정보를 한곳에서! `Pet-topia`는 반려동물 보호자와 예비 보호자들을 위한 올인원 정보 제공 서비스입니다. 반려동물 동반 시설, 커뮤니티, AI 챗봇 상담 등 다양한 기능을 통해 반려동물과 함께하는 삶을 더욱 풍요롭게 만들어갑니다.

### 🎯 주요 기능

* **🗺️ 반려동물 동반 시설 검색**
  - 카카오맵 기반 지역별/카테고리별 시설 검색
  - 카페, 식당, 펜션, 병원, 문화시설 등 다양한 카테고리
  - 실시간 위치 기반 검색 및 필터링

* **💬 커뮤니티**
  - 반려동물 관련 정보 공유 게시판
  - 사진/동영상 업로드 및 공유
  - 댓글 및 좋아요 기능

* **🤖 AI 챗봇 상담**
  - Claude AI 기반 반려동물 전문 상담
  - 건강, 훈련, 관리 등 다양한 질문 해결

* **👤 회원 시스템**
  - 일반 회원가입/로그인
  - 카카오 소셜 로그인 지원
  - 개인 프로필 및 즐겨찾기 관리

* **📅 일정 관리**
  - 구글 캘린더 연동
  - 반려동물 관련 일정 관리

---

## 🚀 기술 스택

### Backend
* **Java 21**
* **Spring Boot 3.x**
  - Spring Data JPA
  - Spring Security (JWT 인증)
  - Spring Web
  - Lombok
* **MariaDB (AWS RDS)**
* **AWS S3** (파일 저장)
* **Gradle** (빌드 도구)

### Frontend
* **React 19.1.0**
* **Vite 5.2.0** (빌드 툴)
* **JavaScript (ES6+)**
* **Bootstrap 5.3.7** + **React Bootstrap 2.10.10**
* **React Router 7.7.0** (라우팅)
* **Axios 1.10.0** (API 통신)
* **React Toastify 11.0.5** (알림)
* **Lucide React 0.539.0** (아이콘)

### External APIs
* **카카오맵 API** (지도 및 장소 검색)
* **카카오 로그인 API** (소셜 로그인)
* **구글 캘린더 API** (일정 관리)
* **Claude AI API** (챗봇 상담)

### Infrastructure & Tools
* **AWS EC2** (애플리케이션 배포)
* **AWS RDS** (MariaDB 데이터베이스)
* **AWS S3** (이미지/파일 저장소)
* **GitHub Actions** (CI/CD 파이프라인)
* **Docker** (컨테이너화)

---

## 🌐 배포 정보

### Production Environment
* **서버:** AWS EC2 (t2.micro)
* **데이터베이스:** AWS RDS MariaDB
* **파일 저장소:** AWS S3
* **도메인:** http://13.124.132.168:8080/

### API Documentation
* **Swagger UI:** http://13.124.132.168:8080/swagger-ui/index.html

---

## 🛠️ 로컬 개발 환경 설정

### 필수 요구사항
* **Java 21** 이상
* **Node.js 18** 이상 
* **npm** 또는 **yarn**
* **MariaDB** (로컬 개발 시) 또는 **AWS RDS** 접근 권한

### 1. 프로젝트 클론
```bash
git clone https://github.com/JIWON719CHOI/pet-topia.git
cd pet-topia
```

### 2. 백엔드 설정
```bash
# backend 디렉토리로 이동
cd backend

# src/main/resources/secret/custom.properties 파일 생성 후 API 키 입력:
spring.datasource.password=your_mariadb_password
aws.access.key=your_aws_access_key
aws.secret.key=your_aws_secret_key
aws.s3.bucket.name=your_s3_bucket_name
image.prefix=https://your_s3_bucket.s3.ap-northeast-2.amazonaws.com/
kakao.app.key=your_kakao_app_key
google.calendar.key=your_google_calendar_api_key
claude.api.key=your_claude_api_key

# Gradle 빌드 및 실행
./gradlew clean build
./gradlew bootRun
```

### 3. 프론트엔드 설정
```bash
# frontend 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
VITE_KAKAO_APP_KEY=your_kakao_app_key

# 개발 서버 실행
npm run dev
```

### 4. 접속 확인
* **프론트엔드:** http://localhost:5173
* **백엔드 API:** http://localhost:8080
* **Swagger UI:** http://localhost:8080/swagger-ui/index.html

---

## 📁 프로젝트 구조

```
pet-topia/
├── backend/                 # Spring Boot 백엔드
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── build.gradle
├── frontend/                # React 프론트엔드
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .github/workflows/       # GitHub Actions CI/CD
└── README.md
```

---

## 🚀 배포 프로세스

### 자동 배포 (GitHub Actions)
1. `main` 브랜치에 코드 push
2. GitHub Actions 워크플로우 자동 실행
3. 백엔드 빌드 및 테스트
4. 프론트엔드 빌드
5. AWS EC2로 자동 배포

### 수동 배포
```bash
# 백엔드 빌드
./gradlew build

# 프론트엔드 빌드
npm run build

# JAR 파일을 EC2로 전송 및 실행
```

---

## 👥 팀 구성

| 역할 | 이름 | GitHub |
|------|------|--------|
| **팀장** | 최지원 | [@JIWON719CHOI](https://github.com/JIWON719CHOI) |
| **팀원** | 신유민 | [@yumin359](https://github.com/yumin359) |
| **팀원** | 전석윤 | [@yopig](https://github.com/yopig) |

---

## 📝 주요 기능 상세

### 🗺️ 시설 검색 시스템
- **실시간 지도 연동:** 카카오맵 API를 통한 시각적 위치 확인
- **다양한 필터링:** 지역, 카테고리, 반려동물 종류별 검색
- **상세 정보 제공:** 시설별 상세 정보, 리뷰, 평점

### 💬 커뮤니티 플랫폼
- **멀티미디어 지원:** 이미지, 동영상 업로드 (AWS S3 저장)
- **실시간 상호작용:** 댓글, 좋아요, 대댓글 기능
- **반응형 디자인:** 모바일/데스크톱 최적화

### 🤖 AI 챗봇 서비스
- **전문 상담:** Claude AI 기반 반려동물 전문 상담
- **실시간 응답:** 빠르고 정확한 답변 제공
- **사용자 친화적 UI:** 직관적인 채팅 인터페이스

## 📋 주요 라이브러리 및 의존성

### Frontend Dependencies
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.7.0",
  "axios": "^1.10.0",
  "bootstrap": "^5.3.7",
  "react-bootstrap": "^2.10.10",
  "react-toastify": "^11.0.5",
  "jwt-decode": "^4.0.0",
  "@react-google-maps/api": "^2.20.7",
  "lucide-react": "^0.539.0",
  "react-icons": "^5.5.0"
}
```

### Backend Dependencies
- **Spring Boot 3.x**
- **Spring Data JPA**
- **Spring Security 6.x**
- **MariaDB Connector**
- **AWS SDK for Java**
- **JWT Support**

### 보안
- **JWT 토큰 기반 인증**
- **Spring Security 적용**
- **CORS 정책 설정**
- **API 키 환경변수 관리**

### 성능
- **Spring Boot 최적화**
- **React 컴포넌트 최적화**
- **이미지 최적화 및 CDN 활용**
- **데이터베이스 인덱싱**

### 사용자 경험
- **반응형 웹 디자인**
- **직관적인 UI/UX**
- **빠른 로딩 속도**
- **접근성 고려**

---

## 📞 문의 및 지원

프로젝트 관련 문의사항이나 버그 리포트는 [Issues](https://github.com/JIWON719CHOI/pet-topia/issues)를 통해 제보해주세요.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
