/**
 * Meta Threads Graph API Client
 *
 * 使用官方 Meta Graph API 取得 Threads 資料
 * API 文檔: https://developers.facebook.com/docs/threads
 */

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

// Threads 用戶資料欄位
export interface ThreadsProfile {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

// Threads 貼文資料欄位
export interface ThreadsPost {
  id: string;
  text?: string;
  media_type?: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  username?: string;
  shortcode?: string;
  thumbnail_url?: string;
  is_quote_post?: boolean;
  has_replies?: boolean;
  reply_audience?: string;
}

// Threads 貼文 Insights
export interface ThreadsInsights {
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
}

// 完整的貼文資料（包含 insights）
export interface ThreadsPostWithInsights extends ThreadsPost {
  insights?: ThreadsInsights;
}

// API 回應格式
interface ThreadsApiResponse<T> {
  data?: T;
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

// 錯誤類型
export class ThreadsApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public type: string
  ) {
    super(message);
    this.name = "ThreadsApiError";
  }
}

/**
 * Threads API 客戶端
 */
export class ThreadsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    this.accessToken = accessToken;
  }

  /**
   * 發送 API 請求
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${THREADS_API_BASE}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: ThreadsApiResponse<T> = await response.json();

    if (data.error) {
      throw new ThreadsApiError(
        data.error.message,
        data.error.code,
        data.error.type
      );
    }

    if (!response.ok) {
      throw new ThreadsApiError(
        `API request failed with status ${response.status}`,
        response.status,
        "HTTPError"
      );
    }

    return data as T;
  }

  /**
   * 取得當前授權用戶的資料
   */
  async getProfile(): Promise<ThreadsProfile> {
    const fields = [
      "id",
      "username",
      "name",
      "threads_profile_picture_url",
      "threads_biography",
    ].join(",");

    const data = await this.request<ThreadsProfile>("/me", { fields });
    return data;
  }

  /**
   * 取得指定用戶的 Threads 貼文
   * @param userId 用戶 ID (預設為 "me" 代表當前授權用戶)
   * @param limit 取得數量 (預設 25，最多 100)
   */
  async getThreads(
    userId: string = "me",
    limit: number = 25
  ): Promise<ThreadsPost[]> {
    const fields = [
      "id",
      "text",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "username",
      "shortcode",
      "thumbnail_url",
      "is_quote_post",
      "has_replies",
      "reply_audience",
    ].join(",");

    const data = await this.request<{ data: ThreadsPost[] }>(
      `/${userId}/threads`,
      { fields, limit: Math.min(limit, 100).toString() }
    );

    return data.data || [];
  }

  /**
   * 取得單一貼文的詳細資訊
   */
  async getThread(threadId: string): Promise<ThreadsPost> {
    const fields = [
      "id",
      "text",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "username",
      "shortcode",
      "thumbnail_url",
      "is_quote_post",
      "has_replies",
      "reply_audience",
    ].join(",");

    const data = await this.request<ThreadsPost>(`/${threadId}`, { fields });
    return data;
  }

  /**
   * 取得貼文的 Insights 數據
   */
  async getThreadInsights(threadId: string): Promise<ThreadsInsights> {
    const metrics = ["views", "likes", "replies", "reposts", "quotes"].join(",");

    try {
      const data = await this.request<{
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      }>(`/${threadId}/insights`, { metric: metrics });

      const insights: ThreadsInsights = {};

      for (const metric of data.data || []) {
        const value = metric.values?.[0]?.value ?? 0;
        switch (metric.name) {
          case "views":
            insights.views = value;
            break;
          case "likes":
            insights.likes = value;
            break;
          case "replies":
            insights.replies = value;
            break;
          case "reposts":
            insights.reposts = value;
            break;
          case "quotes":
            insights.quotes = value;
            break;
        }
      }

      return insights;
    } catch (error) {
      // Insights 可能因權限不足而失敗，回傳空物件
      console.warn(`Failed to get insights for thread ${threadId}:`, error);
      return {};
    }
  }

  /**
   * 取得貼文列表及其 Insights
   */
  async getThreadsWithInsights(
    userId: string = "me",
    limit: number = 25
  ): Promise<ThreadsPostWithInsights[]> {
    const threads = await this.getThreads(userId, limit);

    // 並行取得所有貼文的 insights
    const threadsWithInsights = await Promise.all(
      threads.map(async (thread) => {
        const insights = await this.getThreadInsights(thread.id);
        return { ...thread, insights };
      })
    );

    return threadsWithInsights;
  }

  /**
   * 取得用戶帳號 Insights（整體數據）
   */
  async getAccountInsights(): Promise<{
    followers_count?: number;
    total_views?: number;
  }> {
    try {
      const data = await this.request<{
        data: Array<{ name: string; total_value?: { value: number } }>;
      }>("/me/threads_insights", {
        metric: "followers_count,views",
      });

      const result: { followers_count?: number; total_views?: number } = {};

      for (const metric of data.data || []) {
        const value = metric.total_value?.value;
        if (metric.name === "followers_count" && value !== undefined) {
          result.followers_count = value;
        } else if (metric.name === "views" && value !== undefined) {
          result.total_views = value;
        }
      }

      return result;
    } catch (error) {
      console.warn("Failed to get account insights:", error);
      return {};
    }
  }
}

/**
 * 建立 Threads API 客戶端
 */
export function createThreadsClient(accessToken?: string): ThreadsClient | null {
  const token = accessToken || process.env.THREADS_ACCESS_TOKEN;

  if (!token) {
    return null;
  }

  return new ThreadsClient(token);
}
