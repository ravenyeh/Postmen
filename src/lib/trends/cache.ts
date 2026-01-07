/**
 * 簡易 in-memory 快取機制
 * 在 Vercel Serverless 環境中，每個 instance 有自己的快取
 * 適合 MVP 階段使用，未來可以換成 Vercel KV 或 Redis
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 15 * 60 * 1000; // 15 分鐘

  /**
   * 取得快取資料
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 設定快取資料
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * 刪除快取
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 取得快取統計資訊
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 單例模式
export const trendCache = new MemoryCache();

// 快取 key 常數
export const CACHE_KEYS = {
  TRENDS_ALL: "trends:all",
  TRENDS_NEWS: "trends:news",
  TRENDS_GOOGLE: "trends:google",
  TRENDS_SOCIAL: "trends:social",
} as const;

// 快取 TTL 常數（毫秒）
export const CACHE_TTL = {
  TRENDS: 15 * 60 * 1000,      // 15 分鐘
  NEWS: 30 * 60 * 1000,        // 30 分鐘
  GOOGLE: 60 * 60 * 1000,      // 1 小時
} as const;
