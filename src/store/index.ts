import { create } from "zustand";
import type {
  UserInput,
  GeneratedPost,
  Persona,
  Tone,
  Length,
  TrendData,
} from "@/types";

interface PostGeneratorState {
  // 用戶輸入
  input: UserInput;
  // 生成結果
  posts: GeneratedPost[];
  // 使用的熱門話題
  trendsUsed: string[];
  // AI 搜尋發現的爆款技巧
  viralTechniques: string[];
  // 載入狀態
  isLoading: boolean;
  // 錯誤訊息
  error: string | null;

  // 熱門話題相關
  trends: TrendData | null;
  trendsLoading: boolean;
  trendsError: string | null;
  trendsUpdatedAt: string | null;

  // Actions
  setTopic: (topic: string) => void;
  setPersona: (persona: Persona) => void;
  setTone: (tone: Tone) => void;
  setLength: (length: Length) => void;
  setIncludeEmoji: (include: boolean) => void;
  setIncludeTrend: (include: boolean) => void;
  setVariations: (count: number) => void;
  resetInput: () => void;

  // 生成相關
  setLoading: (loading: boolean) => void;
  setPosts: (posts: GeneratedPost[]) => void;
  setTrendsUsed: (trends: string[]) => void;
  setError: (error: string | null) => void;
  clearResults: () => void;

  // 生成貼文
  generatePosts: () => Promise<void>;

  // 熱門話題相關
  fetchTrends: () => Promise<void>;
  setTrends: (trends: TrendData) => void;
}

const defaultInput: UserInput = {
  topic: "",
  persona: "general",
  tone: "humorous",
  length: "short",
  includeEmoji: true,
  includeTrend: true,
  variations: 3,
};

export const usePostGeneratorStore = create<PostGeneratorState>((set, get) => ({
  // 初始狀態
  input: defaultInput,
  posts: [],
  trendsUsed: [],
  viralTechniques: [],
  isLoading: false,
  error: null,

  // 熱門話題初始狀態
  trends: null,
  trendsLoading: false,
  trendsError: null,
  trendsUpdatedAt: null,

  // Input setters
  setTopic: (topic) =>
    set((state) => ({ input: { ...state.input, topic } })),
  setPersona: (persona) =>
    set((state) => ({ input: { ...state.input, persona } })),
  setTone: (tone) =>
    set((state) => ({ input: { ...state.input, tone } })),
  setLength: (length) =>
    set((state) => ({ input: { ...state.input, length } })),
  setIncludeEmoji: (includeEmoji) =>
    set((state) => ({ input: { ...state.input, includeEmoji } })),
  setIncludeTrend: (includeTrend) =>
    set((state) => ({ input: { ...state.input, includeTrend } })),
  setVariations: (variations) =>
    set((state) => ({ input: { ...state.input, variations } })),
  resetInput: () => set({ input: defaultInput }),

  // Result setters
  setLoading: (isLoading) => set({ isLoading }),
  setPosts: (posts) => set({ posts }),
  setTrendsUsed: (trendsUsed) => set({ trendsUsed }),
  setError: (error) => set({ error }),
  clearResults: () => set({ posts: [], trendsUsed: [], viralTechniques: [], error: null }),

  // 熱門話題 setter
  setTrends: (trends) =>
    set({ trends, trendsUpdatedAt: trends.updatedAt }),

  // 取得熱門話題
  fetchTrends: async () => {
    set({ trendsLoading: true, trendsError: null });

    try {
      const response = await fetch("/api/trends");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "無法取得熱門話題");
      }

      set({
        trends: data,
        trendsUpdatedAt: data.updatedAt,
        trendsLoading: false,
      });
    } catch (err) {
      set({
        trendsError: err instanceof Error ? err.message : "取得熱門話題失敗",
        trendsLoading: false,
      });
    }
  },

  // 生成貼文
  generatePosts: async () => {
    const { input, trends } = get();

    if (!input.topic.trim()) {
      set({ error: "請輸入主題或靈感" });
      return;
    }

    set({ isLoading: true, error: null, posts: [], trendsUsed: [], viralTechniques: [] });

    try {
      // 如果要結合熱門話題且已有話題資料，傳送給 API
      const requestBody = {
        ...input,
        currentTrends: input.includeTrend && trends
          ? [...trends.threads, ...trends.news, ...trends.google]
          : undefined,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，請稍後再試");
      }

      set({
        posts: data.posts,
        trendsUsed: data.trendUsed || [],
        viralTechniques: data.viralTechniques || [],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "發生未知錯誤",
        isLoading: false,
      });
    }
  },
}));
