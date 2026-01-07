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

// 模板對應說明
const TEMPLATE_INSTRUCTIONS: Record<TemplateType, string> = {
  story: "故事型：情境 → 轉折 → 領悟。例如「以前我以為…後來才發現…」",
  question: "問題型：拋出引人思考的問題。例如「你有沒有想過，為什麼…？」",
  list: "清單型：數字 + 重點列舉。例如「工程師必備的 3 個習慣：」",
  contrast: "反差型：期待 vs 現實。例如「別人以為我在…其實我在…」",
  quote: "金句型：一句話觀點，精煉有力。例如「真正的成長是…」",
  sarcastic: "吐槽型：共鳴痛點 + 幽默。例如「每次說好只看一集，結果…」",
};

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

// 建構 Prompt
function buildPrompt(input: UserInput, trends: string[]): string {
  const selectedTemplates = MVP_TEMPLATES.slice(0, input.variations);
  const templateInstructions = selectedTemplates
    .map((t, i) => `${i + 1}. ${TEMPLATE_INSTRUCTIONS[t]}`)
    .join("\n");

  return `你是一個專業的社群媒體文案專家，專精於撰寫 Threads 爆款貼文。你了解台灣用戶的語言習慣和文化脈絡。

【用戶設定】
- 身份定位：${PERSONA_DESCRIPTIONS[input.persona]}
- 主題/靈感：${input.topic}
- 語氣風格：${TONE_DESCRIPTIONS[input.tone]}
- 字數限制：${LENGTH_LIMITS[input.length]}
- 使用 Emoji：${input.includeEmoji ? "是，適當使用 emoji 增加趣味" : "否，不使用 emoji"}

${input.includeTrend ? `【當前熱門話題參考】\n${trends.join("、")}\n可以嘗試巧妙融入這些話題元素，但不要生硬。` : ""}

【任務】
請產生 ${input.variations} 個版本的 Threads 貼文，每個使用不同的文案框架：

${templateInstructions}

【重要規則】
1. 貼文要接地氣，符合台灣年輕人的說話方式
2. 內容要有記憶點，讓人想按讚或分享
3. 避免說教或太正經，要有社群感
4. 每個版本要有明顯不同的切入角度
5. 字數嚴格控制在限制內

【輸出格式】
請以 JSON 格式輸出，格式如下：
{
  "posts": [
    {
      "content": "貼文內容",
      "template": "story|contrast|quote",
      "hashtags": ["建議的hashtag，2-3個"],
      "reasoning": "簡短說明這個版本的設計思路"
    }
  ]
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

  const mockPosts: Record<TemplateType, { content: string; hashtags: string[] }> = {
    story: {
      content: input.includeEmoji
        ? `以前我以為${input.topic}只是說說而已\n後來才發現，這真的會改變一切 🤯\n\n現在回頭看，還好當初沒放棄`
        : `以前我以為${input.topic}只是說說而已\n後來才發現，這真的會改變一切\n\n現在回頭看，還好當初沒放棄`,
      hashtags: ["#人生體悟", "#成長日記"],
    },
    contrast: {
      content: input.includeEmoji
        ? `別人以為我在研究${input.topic}\n其實我在想今天中午要吃什麼 🍜\n\n專注？不存在的`
        : `別人以為我在研究${input.topic}\n其實我在想今天中午要吃什麼\n\n專注？不存在的`,
      hashtags: ["#真實日常", "#社畜心聲"],
    },
    quote: {
      content: input.includeEmoji
        ? `關於${input.topic}這件事\n真正的高手從不解釋，只用結果說話 💪`
        : `關於${input.topic}這件事\n真正的高手從不解釋，只用結果說話`,
      hashtags: ["#金句", "#人生哲學"],
    },
    question: {
      content: input.includeEmoji
        ? `你有沒有想過\n為什麼${input.topic}總是這麼難？🤔\n\n說真的，我到現在還在想`
        : `你有沒有想過\n為什麼${input.topic}總是這麼難？\n\n說真的，我到現在還在想`,
      hashtags: ["#問題", "#思考"],
    },
    list: {
      content: input.includeEmoji
        ? `關於${input.topic}，3個必知重點：\n\n1️⃣ 堅持比天份重要\n2️⃣ 方向比速度重要\n3️⃣ 行動比計劃重要`
        : `關於${input.topic}，3個必知重點：\n\n1. 堅持比天份重要\n2. 方向比速度重要\n3. 行動比計劃重要`,
      hashtags: ["#乾貨", "#筆記"],
    },
    sarcastic: {
      content: input.includeEmoji
        ? `每次說好要認真${input.topic}\n結果刷了兩小時手機 📱\n\n時間管理大師，說的就是我（反話）`
        : `每次說好要認真${input.topic}\n結果刷了兩小時手機\n\n時間管理大師，說的就是我（反話）`,
      hashtags: ["#自嘲", "#真實"],
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
    };
  });

  return {
    posts,
    trendUsed: input.includeTrend ? trends : undefined,
  };
}
