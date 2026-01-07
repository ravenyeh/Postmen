# Threads 貼文產生器

AI 驅動的 Threads 高流量貼文創作工具，幫助你快速產出具有高互動潛力的貼文內容。

## 功能特色

- 根據主題/靈感生成多版本貼文
- 支援多種身份定位（工程師/創業者/運動員/一般用戶）
- 多種語氣風格（幽默/專業/勵志/吐槽/療癒）
- 3 種文案模板（故事型、反差型、金句型）
- 互動潛力評分（情緒共鳴、可分享性、時效性）
- 建議最佳發文時機

## 技術架構

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **狀態管理**: Zustand
- **AI 生成**: Perplexity API
- **部署**: Vercel

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env.local` 並填入你的 API Key：

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

```env
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

> 可在 [Perplexity API Settings](https://www.perplexity.ai/settings/api) 取得 API Key

### 3. 啟動開發伺服器

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 即可使用。

## 部署到 Vercel

### 方法一：透過 Vercel Dashboard

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 匯入專案
3. 在 Environment Variables 中設定：
   - `PERPLEXITY_API_KEY`: 你的 Perplexity API Key

### 方法二：使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 設定環境變數
vercel env add PERPLEXITY_API_KEY
```

## 環境變數說明

| 變數名稱 | 必填 | 說明 |
|---------|------|------|
| `PERPLEXITY_API_KEY` | 是 | Perplexity API Key |

## 專案結構

```
src/
├── app/
│   ├── api/
│   │   └── generate/      # 貼文生成 API
│   ├── globals.css        # 全域樣式
│   ├── layout.tsx         # 根佈局
│   └── page.tsx           # 首頁
├── components/
│   ├── ui/                # UI 基礎元件
│   ├── post-form.tsx      # 輸入表單
│   └── post-preview.tsx   # 結果預覽
├── lib/
│   └── utils.ts           # 工具函式
├── store/
│   └── index.ts           # Zustand 狀態管理
└── types/
    └── index.ts           # TypeScript 類型定義
```

## 開發計畫

- [x] Phase 1: 核心生成功能 (MVP)
- [ ] Phase 2: 熱門話題整合 (Google Trends, Threads API)
- [ ] Phase 3: 用戶系統 (Firebase Auth)
- [ ] Phase 4: 進階功能 (成效追蹤、發文排程)

## License

MIT
