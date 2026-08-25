# 씻기순서 앱 — Agent Memory Core

## 프로젝트 정체성
- **앱명**: 오늘은 어디부터 씻지?
- **로컬 경로**: `/Users/byungchulpark/앱개발_2026/라영_씻기순서/wash-order-app`
- **스택**: Next.js App Router (16.3.1), Tailwind CSS 4, TypeScript
- **배포**: AWS Amplify (`app-id: d1qohqt5mb5sln`, branch: `main`, region: `ap-northeast-2`)
- **URL**: `https://main.d1qohqt5mb5sln.amplifyapp.com`
- **GitHub**: `https://github.com/tobeapro74/wash-order-app`
- **API Base**: `https://buarx90gmk.execute-api.ap-northeast-2.amazonaws.com/prod`

## 카카오 로그인 핵심 설정
- REST API 키: `36794df87998cd398c837ba4c6c43b4d`
- JavaScript 키: `8cefe9fe0a51a3cb8f0b0f23cbb7e18d`
- Redirect URI: `https://main.d1qohqt5mb5sln.amplifyapp.com/auth/kakao`
- 클라이언트 시크릿: **OFF** (Kakao 콘솔에서 비활성화)
- 토큰 교환: `/api/kakao-token` Route Handler (서버사이드, CORS 우회)

## 핵심 결정사항

### 날짜 기준: KST
```ts
function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
```
- `wash.ts`의 `getTodayOrder()`, `hasVotedToday()`, `markVotedToday()` 모두 이 함수 사용
- `new Date().toISOString()`은 UTC → KST 아님, 절대 사용 금지

### 온보딩 플로우
- `localStorage.getItem("wash_onboarded")` 없으면 신규 유저 → `/onboarding`으로 이동
- 온보딩 완료 시 `localStorage.setItem("wash_onboarded", "1")` → `/setup`으로 이동
- 흐름: 로그인 → (신규) 온보딩 → setup → today / (기존) today

### 유저 정보 저장
- `localStorage("wash_kakao_user")` — `{ kakaoId, nickname, profileImage }`
- `useAuth()` 훅으로 비로그인 체크 (비로그인 시 `/login` 리다이렉트)

## 페이지 구조
| 경로 | 설명 |
|------|------|
| `/login` | 카카오 로그인 |
| `/auth/kakao` | OAuth 콜백 처리 |
| `/onboarding` | 앱 소개 3슬라이드 (신규 유저만) |
| `/nickname` | 닉네임 등록 (카카오 닉네임 없을 때) |
| `/setup` | 나의 씻기 루틴 설정 |
| `/today` | 오늘의 씻기 순서 룰렛 |
| `/building` | 24층 씻기 빌딩 순위 |
| `/api/kakao-token` | 카카오 토큰 교환 Route Handler |

## 빌딩 순위 설계
- 층수 순위 기준: `score = 좋아요×2 - 싫어요×1`
- 👍/👎 개별 카운터를 DynamoDB `wash-rankings`에 분리 저장 (likes, dislikes 컬럼)
- 빌딩 화면에서 👍 N / 👎 N 분리 표시

## 룰렛 설계
- 돌릴 때마다 새로 랜덤 (오늘 1회 고정 아님)
- `rotation % 360` 정규화로 누적 오차 방지

## 마지막 업데이트
- 날짜: 2026-08-18
- 세션: session02_20260818
