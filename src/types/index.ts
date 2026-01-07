// 用戶輸入相關類型
export type Persona = "engineer" | "entrepreneur" | "athlete" | "general";
export type Tone = "humorous" | "professional" | "inspirational" | "sarcastic" | "healing";
export type Length = "very_short" | "short" | "medium";
export type TemplateType = "story" | "question" | "list" | "contrast" | "quote" | "sarcastic";

export interface UserInput {
  topic: string;
  persona: Persona;
  tone: Tone;
  length: Length;
  includeEmoji: boolean;
  includeTrend: boolean;
  variations: number;
}

// 生成結果相關類型
export interface EngagementScore {
  overall: number;      // 0-100 總分
  emotional: number;    // 情緒共鳴
  shareability: number; // 可分享性
  timeliness: number;   // 時效性
}

export interface GeneratedPost {
  id: string;
  content: string;
  template: TemplateType;
  score: EngagementScore;
  hashtags: string[];
  suggestedTime: string;
  reasoning?: string;
}

export interface GenerationRequest {
  input: UserInput;
  templates?: TemplateType[];
}

export interface GenerationResponse {
  posts: GeneratedPost[];
  trendUsed?: string[];
  viralTechniques?: string[];  // AI 搜尋發現並應用的爆款技巧
  error?: string;
}

// 熱門話題相關類型
export interface TrendData {
  threads: string[];
  google: string[];
  news: string[];
  updatedAt: string;
}

// 用戶偏好設定相關類型
export interface UserPreferences {
  defaultPersona: Persona;
  defaultTone: Tone;
  defaultLength: Length;
  defaultIncludeEmoji: boolean;
  defaultIncludeTrend: boolean;
}

// Persona 和 Tone 的顯示名稱
export const PERSONA_LABELS: Record<Persona, string> = {
  engineer: "工程師",
  entrepreneur: "創業者",
  athlete: "運動員",
  general: "一般用戶",
};

export const TONE_LABELS: Record<Tone, string> = {
  humorous: "幽默",
  professional: "專業",
  inspirational: "勵志",
  sarcastic: "吐槽",
  healing: "療癒",
};

export const LENGTH_LABELS: Record<Length, string> = {
  very_short: "極短 (<50字)",
  short: "短 (<100字)",
  medium: "中 (<200字)",
};

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  story: "故事型",
  question: "問題型",
  list: "清單型",
  contrast: "反差型",
  quote: "金句型",
  sarcastic: "吐槽型",
};
