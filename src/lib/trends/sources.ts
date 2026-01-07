/**
 * 熱門話題來源整合
 * 支援多種資料來源：台灣新聞 RSS、社群熱門話題等
 */

import { trendCache, CACHE_KEYS, CACHE_TTL } from "./cache";

export interface TrendItem {
  title: string;
  source: "news" | "google" | "social";
  url?: string;
  publishedAt?: string;
}

export interface TrendData {
  news: string[];
  google: string[];
  social: string[];
  updatedAt: string;
}

// 台灣主要新聞 RSS 來源
const NEWS_RSS_FEEDS = [
  {
    name: "聯合新聞網",
    url: "https://udn.com/rssfeed/news/2/6638?ch=news",
    category: "熱門",
  },
  {
    name: "自由時報",
    url: "https://news.ltn.com.tw/rss/all.xml",
    category: "即時",
  },
];

// 模擬的社群熱門話題（實際應用中可以爬取 Threads/Twitter）
const MOCK_SOCIAL_TRENDS = [
  "AI 工具推薦",
  "遠距工作心得",
  "躺平文化",
  "年終獎金",
  "斜槓青年",
  "職場生存法則",
  "投資理財",
  "健身日常",
  "追劇推薦",
  "咖啡因戒斷",
];

// 模擬的 Google 熱門搜尋（實際應用中可以使用 Google Trends API）
const MOCK_GOOGLE_TRENDS = [
  "台積電",
  "AI",
  "股市",
  "天氣",
  "春節",
  "電動車",
  "科技業",
  "房價",
];

/**
 * 解析 RSS XML 取得新聞標題
 */
function parseRSSItems(xml: string): string[] {
  const titles: string[] = [];

  // 簡易 XML 解析，提取 <title> 標籤內容
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);

  if (itemMatches) {
    for (const item of itemMatches.slice(0, 10)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      if (titleMatch && titleMatch[1]) {
        // 清理標題
        const title = titleMatch[1]
          .replace(/<!\[CDATA\[|\]\]>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .trim();

        if (title && title.length > 2) {
          titles.push(title);
        }
      }
    }
  }

  return titles;
}

/**
 * 從新聞標題提取關鍵詞
 */
function extractKeywords(titles: string[]): string[] {
  const keywords: Map<string, number> = new Map();

  // 常見的停用詞
  const stopWords = new Set([
    "的", "是", "在", "了", "和", "與", "或", "被", "將", "讓",
    "也", "都", "就", "而", "及", "等", "這", "那", "有", "為",
    "不", "到", "上", "下", "中", "大", "小", "新", "最", "更",
  ]);

  for (const title of titles) {
    // 使用正則提取可能的關鍵詞（2-6個字的詞組）
    const words = title.match(/[\u4e00-\u9fa5]{2,6}/g) || [];

    for (const word of words) {
      if (!stopWords.has(word)) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    }
  }

  // 排序並取前 10 個高頻詞
  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * 從 RSS 來源取得新聞熱門話題
 */
async function fetchNewsTrends(): Promise<string[]> {
  // 檢查快取
  const cached = trendCache.get<string[]>(CACHE_KEYS.TRENDS_NEWS);
  if (cached) {
    return cached;
  }

  const allTitles: string[] = [];

  for (const feed of NEWS_RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ThreadsPostGenerator/1.0)",
        },
        next: { revalidate: 1800 }, // Next.js 快取 30 分鐘
      });

      if (response.ok) {
        const xml = await response.text();
        const titles = parseRSSItems(xml);
        allTitles.push(...titles);
      }
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.name}:`, error);
    }
  }

  // 如果 RSS 取得失敗，使用備援資料
  if (allTitles.length === 0) {
    const fallbackNews = [
      "科技業年終獎金出爐",
      "AI 應用持續發燒",
      "遠距工作成新常態",
      "年輕人創業潮興起",
      "健康意識抬頭",
    ];
    trendCache.set(CACHE_KEYS.TRENDS_NEWS, fallbackNews, CACHE_TTL.NEWS);
    return fallbackNews;
  }

  const keywords = extractKeywords(allTitles);
  trendCache.set(CACHE_KEYS.TRENDS_NEWS, keywords, CACHE_TTL.NEWS);

  return keywords;
}

/**
 * 取得 Google 熱門搜尋（目前使用模擬資料）
 * 未來可以整合 Google Trends API 或 SerpAPI
 */
async function fetchGoogleTrends(): Promise<string[]> {
  const cached = trendCache.get<string[]>(CACHE_KEYS.TRENDS_GOOGLE);
  if (cached) {
    return cached;
  }

  // 隨機打亂並選取部分
  const shuffled = [...MOCK_GOOGLE_TRENDS].sort(() => Math.random() - 0.5);
  const trends = shuffled.slice(0, 5);

  trendCache.set(CACHE_KEYS.TRENDS_GOOGLE, trends, CACHE_TTL.GOOGLE);
  return trends;
}

/**
 * 取得社群熱門話題（目前使用模擬資料）
 * 未來可以爬取 Threads 或 Twitter 熱門
 */
async function fetchSocialTrends(): Promise<string[]> {
  const cached = trendCache.get<string[]>(CACHE_KEYS.TRENDS_SOCIAL);
  if (cached) {
    return cached;
  }

  // 隨機打亂並選取部分
  const shuffled = [...MOCK_SOCIAL_TRENDS].sort(() => Math.random() - 0.5);
  const trends = shuffled.slice(0, 5);

  trendCache.set(CACHE_KEYS.TRENDS_SOCIAL, trends, CACHE_TTL.TRENDS);
  return trends;
}

/**
 * 取得所有熱門話題
 */
export async function fetchAllTrends(): Promise<TrendData> {
  // 檢查整合快取
  const cached = trendCache.get<TrendData>(CACHE_KEYS.TRENDS_ALL);
  if (cached) {
    return cached;
  }

  // 並行取得所有來源
  const [news, google, social] = await Promise.all([
    fetchNewsTrends(),
    fetchGoogleTrends(),
    fetchSocialTrends(),
  ]);

  const data: TrendData = {
    news,
    google,
    social,
    updatedAt: new Date().toISOString(),
  };

  trendCache.set(CACHE_KEYS.TRENDS_ALL, data, CACHE_TTL.TRENDS);
  return data;
}

/**
 * 取得合併的熱門話題列表（去重）
 */
export async function getMergedTrends(limit: number = 10): Promise<string[]> {
  const data = await fetchAllTrends();

  // 合併所有來源並去重
  const allTrends = [...data.social, ...data.news, ...data.google];
  const uniqueTrends = Array.from(new Set(allTrends));

  return uniqueTrends.slice(0, limit);
}
