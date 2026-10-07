# Cloudflare Pages 배포 가이드

> 이 프로젝트는 **빌드 과정 없는 정적 사이트**라 Cloudflare Pages에 바로 배포됩니다.

## 🎯 3분 배포 (GitHub 연동 권장)

### 1. GitHub 저장소 생성 및 푸시
```bash
cd /home/oojoo50-firebat/Workspace/nodejs/Md2Pdf

# Git 초기화 (이미 되어있다면 생략)
git init
git add .
git commit -m "feat: Markdown to PDF converter with KaTeX, Mermaid, Images"

# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/md2pdf.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Pages 연결
1. [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인
2. 좌측 메뉴 **Workers & Pages** → **Pages** 탭
3. **Create a project** → **Connect to Git**
4. GitHub 인증 후 저장소 선택 (`md2pdf`)

### 3. 빌드 설정 (자동 감지되지만 확인)
| 설정 | 값 | 비고 |
|------|-----|------|
| **Project name** | `md2pdf` | 원하는 이름 |
| **Production branch** | `main` | 기본 브랜치 |
| **Build command** | *(비워둠)* | 정적 사이트라 빌드 불필요 |
| **Build output directory** | `/` | 루트 디렉토리 |
| **Root directory** | `/` | 프로젝트 루트 |
| **Environment variables** | *(없음)* | 필요 없음 |

> **중요**: `Build command`를 비우면 Cloudflare가 "No build command"로 인식하고 정적 파일 그대로 배포합니다.

### 4. 배포 완료
- **Save and Deploy** 클릭
- 30초~1분 후 `https://md2pdf.pages.dev` (또는 커스텀 도메인) 접속 가능

---

## 🔧 커스텀 도메인 연결 (선택)

1. Pages 프로젝트 → **Custom domains** → **Set up a custom domain**
2. 도메인 입력 (예: `pdf.yourdomain.com`)
3. DNS 레코드 자동 추가 안내 따름 (CNAME → `md2pdf.pages.dev`)
4. **Activate domain** → HTTPS 인증서 자동 발급 완료

---

## 📋 배포 후 체크리스트

- [ ] `https://your-project.pages.dev` 접속 → 업로드 화면 표시
- [ ] `sample.md` 드래그 앤 드롭 → 미리보기 렌더링 확인
- [ ] 수학 공식(`$E=mc^2$`, `$$...$$`) 정상 표시
- [ ] Mermaid 다이어그램(플로우차트, 시퀀스 등) 정상 표시
- [ ] 외부 이미지 로드 확인
- [ ] **PDF 다운로드** 버튼 클릭 → PDF 파일 저장 확인
- [ ] 모바일 브라우저에서 레이아웃 확인
- [ ] 커스텀 도메인 연결 시 HTTPS 리다이렉트 확인

---

## ⚡ 성능 최적화 (자동 적용)

Cloudflare Pages가 자동으로 제공:
- **전 세계 300+ PoP 에지 캐시** — 최초 방문 후 초고속 로딩
- **Brotli/Gzip 압축** — `index.html`, `style.css`, `app.js` 자동 압축
- **HTTP/2 + HTTP/3 (QUIC)** — 멀티플렉싱으로 동시 로드
- **자동 HTTPS** — 인증서 갱신 관리 불필요
- **캐시 헤더** — 정적 리소스 `Cache-Control: public, max-age=31536000, immutable`

---

## 💰 비용: **완전 무료**

| 항목 | Cloudflare Pages Free Plan |
|------|---------------------------|
| 월 빌드 횟수 | 500회 (정적 사이트는 빌드 없음 = 무제한) |
| 요청 수 | 무제한 |
| 대역폭 | 무제한 |
| 커스텀 도메인 | 무제한 |
| 프리뷰 배포 (PR당) | 무제한 |

> 정적 사이트는 빌드 과정이 없어 **빌드 횟수 제한 없음**

---

## 🔄 업데이트 배포

```bash
# 로컬에서 수정 후
git add .
git commit -m "fix: improve PDF page breaks"
git push origin main
```

→ Cloudflare가 자동 감지 → **자동 재배포** (30초~1분 소요)

---

## 🛠️ 문제 해결

### "Build failed" 에러가 난다면
```
Build command가 설정되어 있으면 발생
→ Project settings → Build & deployments → Build command: (비워둠)
```

### 이미지가 안 보인다면 (Mixed Content)
- HTTP 이미지 사용 중 → **HTTPS 이미지로 교체** 또는 Base64 인코딩
- `app.js`의 `html2canvas: { useCORS: true }` 이미 설정됨

### PDF가 깨져서 나온다면
- `style.css`의 `@media print` 섹션 확인
- Mermaid/수식/코드 블록 `page-break-inside: avoid` 적용됨

### 커스텀 도메인 DNS 전파 안 됨
- 최대 24시간 소요 (보통 5~30분)
- `dig CNAME yourdomain.com`으로 확인

---

## 📁 파일 구조 확인 (배포 전)
```
md2pdf/
├── index.html      ← 필수 (엔트리 포인트)
├── style.css       ← 필수
├── app.js          ← 필수
├── sample.md       ← 선택 (테스트용)
└── README.md       ← 선택 (문서용)
```

**모두 루트에 있어야 함** (하위 폴더 X)

---

## 🎉 완료!

배포 완료되면:
- **프로덕션**: `https://md2pdf.pages.dev`
- **프리뷰 (PR마다)**: `https://<hash>.md2pdf.pages.dev`
- **커스텀**: `https://pdf.yourdomain.com`

**이제 누구나 서버 비용 없이 무료로 마크다운 → PDF 변환기 사용 가능!** 🚀