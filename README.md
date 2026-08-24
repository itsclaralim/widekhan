# widekhan.com

WIDEKHAN 코퍼레이트 사이트 — 화학 원료 / 식품·농산물 수출입 무역.

## 배포 방식

| 항목 | 값 |
|---|---|
| 호스팅 | GitHub Pages (legacy build) |
| 소스 | 이 레포 `main` 브랜치 루트 `/` |
| 도메인 | `widekhan.com` (`CNAME` 파일로 지정) |
| 빌드 | **없음** — 정적 HTML 그대로 서빙 (`.nojekyll`) |

**`main`에 머지하면 약 30초~1분 뒤 자동 반영됩니다.** CI 파이프라인이나 빌드 단계는 없습니다.

⚠️ `CNAME`과 `.nojekyll` 파일은 절대 삭제하지 마세요. 각각 커스텀 도메인 연결과
Jekyll 처리 우회에 필요합니다.

## 구조

```
/                     영문 (기본)
  index.html          홈
  about.html          회사소개
  chemicals.html      화학 사업부
  agri.html           식품·농산물 사업부
  services.html       무역서비스
  contact.html        문의
  404.html
/ko/                  국문 (동일 구조)
/assets/
  css/main.css        전체 디자인 시스템 (토큰·컴포넌트·반응형)
  js/main.js          모바일 내비, 스크롤 리빌, 문의폼 mailto 처리
  img/favicon.svg
/fonts/               Neue Haas Display (self-hosted)
```

## 수정 시 주의

- 헤더/푸터는 각 페이지에 인라인으로 들어 있습니다(빌드 단계가 없어서). 메뉴를 바꾸면
  **12개 페이지 전부** 수정해야 합니다.
- 색상·간격·타이포는 `assets/css/main.css` 상단의 CSS 변수(`:root`)에서 일괄 조정됩니다.
- 문의 폼은 서버가 없어 `mailto:` 방식으로 동작합니다. 받은편지함 직접 수신을 원하면
  `assets/js/main.js`의 submit 핸들러를 Formspree 등 폼 엔드포인트로 교체하세요.

## 공개 전 채워야 할 항목

HTML 안에 `TODO:` 및 `⚠️` 주석으로 표시해 두었습니다.

- [ ] 취급 품목 카테고리 — 실제 취급 품목만 남기고 정리 (`chemicals.html`, `agri.html`)
- [ ] 회사 개요 표 — 법인명, 사업자등록번호, 설립일, 대표자, 주소 (`about.html`)
- [ ] 대표 전화번호, 정확한 본사 주소 (`contact.html`, 푸터)
- [ ] 실적 수치 밴드 — 확정된 수치가 생기면 주석 해제 (`index.html`)
