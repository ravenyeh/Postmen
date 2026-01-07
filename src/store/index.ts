import { create } from "zustand";
import type {
  UserInput,
  GeneratedPost,
  Persona,
  Tone,
  Length,
} from "@/types";

interface PostGeneratorState {
  // 用戶輸入
  input: UserInput;
  // 生成結果
  posts: GeneratedPost[];
  // 使用的熱門話題
  trendsUsed: string[];
  // 載入狀態
  isLoading: boolean;
  // 錯誤訊息
  error: string | null;

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
  isLoading: false,
  error: null,

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
  clearResults: () => set({ posts: [], trendsUsed: [], error: null }),

  // 生成貼文
  generatePosts: async () => {
    const { input } = get();

    if (!input.topic.trim()) {
      set({ error: "請輸入主題或靈感" });
      return;
    }

    set({ isLoading: true, error: null, posts: [], trendsUsed: [] });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，請稍後再試");
      }

      set({
        posts: data.posts,
        trendsUsed: data.trendUsed || [],
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
