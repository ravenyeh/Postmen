import { NextRequest, NextResponse } from "next/server";
import type {
  UserInput,
  GeneratedPost,
  GenerationResponse,
  TemplateType,
  EngagementScore,
} from "@/types";

// Perplexity API 設定
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// 身份對應描述
const PERSONA_DESCRIPTIONS: Record<string, string> = {
  engineer: "軟體工程師，熟悉科技趨勢，常用程式梗和技術用語",
  entrepreneur: "創業者，關注商業洞察、成長思維和創業經驗",
  athlete: "運動員或健身愛好者，分享訓練心得和健康生活",
  general: "一般社群用戶，分享日常生活和普遍經驗",
};

// 語氣對應描述
const TONE_DESCRIPTIONS: Record<string, string> = {
  humorous: "幽默風趣，帶點自嘲，讓人會心一笑",
  professional: "專業知識分享，有深度但不艱澀",
  inspirational: "正能量勵志，激勵人心但不說教",
  sarcastic: "吐槽風格，點出生活痛點引發共鳴",
  healing: "療癒系，溫暖人心，給人安慰",
};

// 長度對應字數
const LENGTH_LIMITS: Record<string, string> = {
  very_short: "50字以內",
  short: "50-100字",
  medium: "100-200字",
};

// 模板對應說明 - 基於 Threads 爆款研究
const TEMPLATE_INSTRUCTIONS: Record<TemplateType, string> = {
  story: "故事型（反常識）：你以為（常識）是對的？其實（反直覺結論）才是重點。用轉折製造驚喜。",
  question: "問題型（問句引戰）：為什麼（現象）越努力越沒用？答案其實很簡單。引發思考和討論。",
  list: "清單型（數字清單）：3 個（方法/雷點/原則），讓你在（情境）立刻變好。具體有感。",
  contrast: "反差型（對立選邊）：關於（議題），只分兩種人：（A）跟（B）。你是哪種？製造認同。",
  quote: "金句型（下斷言）：先說結論：在（情境）裡，（做法A）比（做法B）有效 10 倍。直接有力。",
  sarcastic: "吐槽型（錯誤警告）：90% 的人做（某事）都錯在第 1 步。點出痛點引共鳴。",
};

// 8 種吸睛開頭句型（基於 Threads 爆款研究）
const HOOK_PATTERNS = [
  "反常識：你以為（常識）是對的？其實（反直覺結論）才是重點。",
  "痛點直擊：如果你也卡在（痛點），先做這 1 件事就好。",
  "下斷言：先說結論：在（情境）裡，（做法A）比（做法B）有效 10 倍。",
  "對立選邊：關於（議題），只分兩種人：（A）跟（B）。你是哪種？",
  "數字清單：3 個（方法/雷點/原則），讓你在（情境）立刻變好。",
  "省時省錢：我用（時間/成本）試出來的：別再（錯誤做法）。",
  "錯誤警告：90% 的人做（某事）都錯在第 1 步。",
  "問句引戰：為什麼（現象）越努力越沒用？答案其實很簡單。",
];

// MVP 階段使用的模板（故事型、反差型、金句型）
const MVP_TEMPLATES: TemplateType[] = ["story", "contrast", "quote"];

// 模擬熱門話題（MVP 階段）
function getMockTrends(): string[] {
  const trends = [
    "AI 工具", "遠距工作", "躺平文化", "年終獎金",
    "新年目標", "咖啡因", "追劇", "健身",
    "投資理財", "斜槓青年", "職場生存",
  ];
  // 隨機選取 3 個
  return trends.sort(() => Math.random() - 0.5).slice(0, 3);
}

// 建構 Prompt - 基於 Threads 爆款研究的具體技巧
function buildPrompt(input: UserInput, trends: string[]): string {
  const selectedTemplates = MVP_TEMPLATES.slice(0, input.variations);
  const templateInstructions = selectedTemplates
    .map((t, i) => `${i + 1}. ${TEMPLATE_INSTRUCTIONS[t]}`)
    .join("\n");

  // 隨機選取幾個 hook 句型作為參考
  const shuffledHooks = [...HOOK_PATTERNS].sort(() => Math.random() - 0.5);
  const selectedHooks = shuffledHooks.slice(0, 4).map((h, i) => `${i + 1}. ${h}`).join("\n");

  return `你是專精 Threads 爆款貼文的文案專家。請根據以下經過驗證的爆款技巧來創作。

【Threads 爆款核心法則】
1. 開頭第 1-2 行就要「直奔主題」，用痛點、好奇或反差把人留住
2. 不要先鋪陳背景，不要用「大家好」「今天想聊聊」這類開場
3. Threads 限制 500 字，用短句、碎段落，讓第一句夠狠、夠清楚
4. 製造「好奇心差距」：先下斷言，暗示原因在後面

【開頭公式】
受眾 + 痛點/目標 + 反差結論 + 讓人想追問的缺口
例如：「給（受眾）：你一直（痛點）不是因為不夠努力，而是（反差結論）」

【8 種吸睛開頭句型，請選擇適合的使用】
${selectedHooks}

【用戶設定】
- 身份定位：${PERSONA_DESCRIPTIONS[input.persona]}
- 主題/靈感：${input.topic}
- 語氣風格：${TONE_DESCRIPTIONS[input.tone]}
- 字數限制：${LENGTH_LIMITS[input.length]}
- 使用 Emoji：${input.includeEmoji ? "是，適當使用 emoji 增加趣味但不過量" : "否，不使用 emoji"}

${input.includeTrend && trends.length > 0 ? `【當前熱門話題】\n${trends.join("、")}\n巧妙融入但不生硬。` : ""}

【任務】
產生 ${input.variations} 個版本的 Threads 貼文，每個使用不同的文案框架：

${templateInstructions}

【重要規則】
1. 開頭第一句就要抓住注意力，禁止平淡開場
2. 符合台灣年輕人說話方式，接地氣有社群感
3. 每個版本切入角度明顯不同
4. 字數嚴格控制在限制內
5. 用短句、適當換行增加可讀性

【輸出格式】
請以 JSON 格式輸出：
{
  "posts": [
    {
      "content": "貼文內容",
      "template": "story|contrast|quote",
      "hashtags": ["建議的hashtag，2-3個"],
      "reasoning": "說明使用了哪種開頭句型和爆款技巧"
    }
  ],
  "viralTechniques": ["列出本次應用的爆款技巧，2-3個"]
}

只輸出 JSON，不要有其他文字。`;
}

// 計算互動潛力分數
function calculateEngagementScore(
  content: string,
  template: TemplateType,
  includeTrend: boolean
): EngagementScore {
  // 基礎分數
  let emotional = 60;
  let shareability = 60;
  let timeliness = includeTrend ? 75 : 50;

  // 根據模板調整
  if (template === "story") {
    emotional += 15;
    shareability += 5;
  } else if (template === "contrast") {
    emotional += 10;
    shareability += 15;
  } else if (template === "quote") {
    emotional += 5;
    shareability += 20;
  }

  // 根據內容特徵調整
  if (content.includes("?") || content.includes("？")) {
    shareability += 5; // 問句增加互動
  }

  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 0 && emojiCount <= 3) {
    emotional += 5;
  }

  // 適當的換行增加可讀性
  const lineBreaks = (content.match(/\n/g) || []).length;
  if (lineBreaks >= 1 && lineBreaks <= 3) {
    shareability += 5;
  }

  // 加入隨機變化
  const variation = () => Math.floor(Math.random() * 10) - 5;
  emotional = Math.min(95, Math.max(40, emotional + variation()));
  shareability = Math.min(95, Math.max(40, shareability + variation()));
  timeliness = Math.min(95, Math.max(40, timeliness + variation()));

  const overall = Math.round((emotional + shareability + timeliness) / 3);

  return { overall, emotional, shareability, timeliness };
}

// 建議發文時間
function getSuggestedTime(template: TemplateType): string {
  const suggestions: Record<TemplateType, string[]> = {
    story: ["週三 21:00", "週日 20:00", "週五 19:00"],
    question: ["週二 12:00", "週四 20:00", "週六 10:00"],
    list: ["週一 08:30", "週三 12:00", "週五 08:30"],
    contrast: ["週四 21:00", "週六 21:00", "週日 14:00"],
    quote: ["週一 07:00", "週三 07:00", "週五 07:00"],
    sarcastic: ["週五 18:00", "週六 22:00", "週日 15:00"],
  };

  const times = suggestions[template];
  return times[Math.floor(Math.random() * times.length)];
}

// 擴展的請求類型，包含前端傳來的熱門話題
interface GenerateRequestBody extends UserInput {
  currentTrends?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequestBody = await request.json();
    const { currentTrends, ...input } = body;

    // 驗證輸入
    if (!input.topic || typeof input.topic !== "string") {
      return NextResponse.json(
        { error: "請提供有效的主題" },
        { status: 400 }
      );
    }

    // 檢查 API Key
    if (!PERPLEXITY_API_KEY) {
      console.warn("Perplexity API key not configured, using mock response");
      // 返回模擬回應（開發用）
      return NextResponse.json(getMockResponse(input, currentTrends));
    }

    // 使用前端傳來的熱門話題，或使用備援資料
    const trends = input.includeTrend
      ? (currentTrends?.slice(0, 5) || getMockTrends())
      : [];

    // 建構 Prompt
    const prompt = buildPrompt(input, trends);

    // 呼叫 Perplexity API
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",  // 使用最新的 sonar 模型
        messages: [
          {
            role: "system",
            content: "你是專業的社群媒體文案專家，專精於撰寫 Threads 爆款貼文。請只輸出 JSON 格式的回應。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);

      // 根據狀態碼提供更具體的錯誤訊息
      if (response.status === 401) {
        console.error("Invalid API key");
        // API key 無效時，回退到模擬回應
        return NextResponse.json(getMockResponse(input, currentTrends));
      } else if (response.status === 429) {
        throw new Error("API 請求過於頻繁，請稍後再試");
      } else {
        // 其他錯誤時，回退到模擬回應而非完全失敗
        console.warn("Falling back to mock response due to API error");
        return NextResponse.json(getMockResponse(input, currentTrends));
      }
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 回應格式錯誤");
    }

    // 解析 JSON 回應
    let parsedContent;
    try {
      // 嘗試提取 JSON（可能包含在 markdown code block 中）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("無法解析 AI 回應");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI 回應格式錯誤");
    }

    // 轉換為標準格式
    const posts: GeneratedPost[] = parsedContent.posts.map(
      (post: { content: string; template: TemplateType; hashtags?: string[]; reasoning?: string }, index: number) => ({
        id: `post_${Date.now()}_${index}`,
        content: post.content,
        template: post.template as TemplateType,
        score: calculateEngagementScore(post.content, post.template as TemplateType, input.includeTrend),
        hashtags: post.hashtags || [],
        suggestedTime: getSuggestedTime(post.template as TemplateType),
        reasoning: post.reasoning,
      })
    );

    const result: GenerationResponse = {
      posts,
      trendUsed: input.includeTrend ? trends : undefined,
      viralTechniques: parsedContent.viralTechniques || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

// 模擬回應（開發用）
function getMockResponse(input: UserInput, currentTrends?: string[]): GenerationResponse {
  const templates = MVP_TEMPLATES.slice(0, input.variations);
  const trends = input.includeTrend
    ? (currentTrends?.slice(0, 3) || getMockTrends())
    : [];

  // 使用爆款開頭句型的模擬貼文
  const mockPosts: Record<TemplateType, { content: string; hashtags: string[]; reasoning: string }> = {
    story: {
      content: input.includeEmoji
        ? `你以為${input.topic}很簡單？\n\n錯。我踩了 3 個月的雷才搞懂：\n問題從來不是不夠努力 🤯\n\n是方向錯了`
        : `你以為${input.topic}很簡單？\n\n錯。我踩了 3 個月的雷才搞懂：\n問題從來不是不夠努力\n\n是方向錯了`,
      hashtags: ["#血淚經驗", "#成長"],
      reasoning: "使用「反常識」開頭句型，先挑戰認知再給結論",
    },
    contrast: {
      content: input.includeEmoji
        ? `關於${input.topic}，只分兩種人：\n\n一種卡在原地抱怨\n一種早就默默行動了 🚀\n\n你是哪種？`
        : `關於${input.topic}，只分兩種人：\n\n一種卡在原地抱怨\n一種早就默默行動了\n\n你是哪種？`,
      hashtags: ["#選邊站", "#行動派"],
      reasoning: "使用「對立選邊」句型，製造認同感和互動",
    },
    quote: {
      content: input.includeEmoji
        ? `先說結論：\n\n在${input.topic}這件事上\n做對方向比埋頭苦幹有效 10 倍 💡\n\n別再用戰術的勤奮掩蓋戰略的懶惰`
        : `先說結論：\n\n在${input.topic}這件事上\n做對方向比埋頭苦幹有效 10 倍\n\n別再用戰術的勤奮掩蓋戰略的懶惰`,
      hashtags: ["#結論先行", "#效率"],
      reasoning: "使用「下斷言」句型，直接給出有力結論",
    },
    question: {
      content: input.includeEmoji
        ? `為什麼${input.topic}越努力越沒用？🤔\n\n答案其實很簡單：\n你努力的方式本身就是錯的\n\n（往下滑我解釋）`
        : `為什麼${input.topic}越努力越沒用？\n\n答案其實很簡單：\n你努力的方式本身就是錯的\n\n（往下滑我解釋）`,
      hashtags: ["#問題", "#思維"],
      reasoning: "使用「問句引戰」句型，引發好奇心",
    },
    list: {
      content: input.includeEmoji
        ? `3 個${input.topic}的雷點，踩過的人都哭了：\n\n1️⃣ 太早想要速成\n2️⃣ 不願意花時間打基礎\n3️⃣ 一直換方法不堅持\n\n中了幾個？`
        : `3 個${input.topic}的雷點，踩過的人都哭了：\n\n1. 太早想要速成\n2. 不願意花時間打基礎\n3. 一直換方法不堅持\n\n中了幾個？`,
      hashtags: ["#避雷", "#乾貨"],
      reasoning: "使用「數字清單」句型，具體有感",
    },
    sarcastic: {
      content: input.includeEmoji
        ? `90% 的人做${input.topic}都錯在第 1 步 😅\n\n不是不夠努力\n是還沒開始就選錯方向了\n\n（我就是那 90%）`
        : `90% 的人做${input.topic}都錯在第 1 步\n\n不是不夠努力\n是還沒開始就選錯方向了\n\n（我就是那 90%）`,
      hashtags: ["#自嘲", "#真實"],
      reasoning: "使用「錯誤警告」句型，用數據製造緊張感並引發共鳴",
    },
  };

  const posts: GeneratedPost[] = templates.map((template, index) => {
    const mock = mockPosts[template];
    return {
      id: `post_${Date.now()}_${index}`,
      content: mock.content,
      template,
      score: calculateEngagementScore(mock.content, template, input.includeTrend),
      hashtags: mock.hashtags,
      suggestedTime: getSuggestedTime(template),
      reasoning: mock.reasoning,
    };
  });

  // 模擬的爆款技巧列表
  const mockViralTechniques = [
    "開頭直奔主題，第 1-2 行抓住注意力",
    "使用反差/對立製造好奇心差距",
    "短句碎段落增加可讀性",
  ];

  return {
    posts,
    trendUsed: input.includeTrend ? trends : undefined,
    viralTechniques: mockViralTechniques,
  };
}
