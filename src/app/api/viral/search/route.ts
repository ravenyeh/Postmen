import { NextRequest, NextResponse } from "next/server";

// Perplexity API 設定
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// 國外爆款貼文類型
export interface ViralPost {
  originalContent: string;
  translatedContent: string;
  source: string; // 來源（創作者或平台）
  hookType: string; // 使用的開頭句型
  engagement: string; // 互動表現描述
  whyViral: string; // 爆款原因分析
  adaptationTips: string; // 在地化建議
}

export interface ViralPostsResponse {
  posts: ViralPost[];
  searchQuery: string;
  timestamp: string;
}

// 搜尋主題類別
const TOPIC_CATEGORIES: Record<string, string> = {
  productivity: "productivity tips, life hacks, time management",
  career: "career advice, job tips, workplace success",
  mindset: "mindset, motivation, personal growth",
  tech: "technology, AI, software, apps",
  finance: "personal finance, money tips, investing",
  relationships: "relationships, communication, social skills",
  health: "health, fitness, wellness, mental health",
  creativity: "creativity, content creation, writing tips",
};

// 建構搜尋 Prompt
function buildSearchPrompt(topic: string, category?: string): string {
  const categoryHint = category && TOPIC_CATEGORIES[category]
    ? `Focus on: ${TOPIC_CATEGORIES[category]}`
    : "";

  return `Search for the most viral and engaging Threads posts from international creators (English-speaking) in the past month about "${topic}". ${categoryHint}

Find 3-5 posts that went viral (high engagement: likes, comments, reposts).

For each viral post found, provide:
1. The exact original content (in English)
2. A Traditional Chinese translation that maintains the viral hook
3. The creator/source if known
4. What hook pattern they used (e.g., contrarian take, listicle, question, storytelling, hot take)
5. Why it went viral (the psychological trigger)
6. Tips to adapt it for Taiwan audience

Output in JSON format:
{
  "posts": [
    {
      "originalContent": "The exact English post content...",
      "translatedContent": "繁體中文翻譯，保持爆款結構...",
      "source": "@creator or 'Unknown'",
      "hookType": "Contrarian / Listicle / Question / etc.",
      "engagement": "e.g., 50K likes, 2K comments",
      "whyViral": "Why this resonated with people...",
      "adaptationTips": "How to localize for Taiwan..."
    }
  ],
  "searchQuery": "${topic}"
}

Important:
- Focus on TEXT posts that can be adapted (not image/video dependent)
- Prefer posts with clear, replicable structures
- Translate naturally for Taiwan readers, not word-by-word
- Keep the hook strength in translation

Only output JSON, no other text.`;
}

// 模擬資料（當 API 不可用時）
function getMockViralPosts(topic: string): ViralPostsResponse {
  return {
    posts: [
      {
        originalContent: `Unpopular opinion:\n\nYou don't need to wake up at 5am to be successful.\n\nI tried it for 6 months.\n\nHere's what actually matters:\n\n→ Consistency over intensity\n→ Energy management > time management\n→ Deep work in YOUR peak hours\n\nStop copying routines. Build your own.`,
        translatedContent: `不受歡迎的觀點：\n\n你不需要 5 點起床才能成功。\n\n我試了 6 個月。\n\n真正重要的是：\n\n→ 持續性 > 強度\n→ 管理精力 > 管理時間\n→ 在你的黃金時段深度工作\n\n別再複製別人的作息了。建立你自己的。`,
        source: "@productivitycreator",
        hookType: "反常識 (Contrarian)",
        engagement: "45K likes, 3.2K comments",
        whyViral: "挑戰了「早起=成功」的主流觀念，引發認同感和討論",
        adaptationTips: "台灣讀者對「早起文化」也有共鳴，可以加入本地化的例子如「不是每個人都適合當晨型人」",
      },
      {
        originalContent: `The harsh truth about ${topic}:\n\n90% of people fail not because they lack talent.\n\nThey fail because:\n\n1. They start without a plan\n2. They quit at the first obstacle\n3. They compare their day 1 to someone's year 5\n\nWhich one is holding you back?`,
        translatedContent: `關於${topic}的殘酷真相：\n\n90% 的人失敗不是因為沒天分。\n\n他們失敗是因為：\n\n1. 沒有計畫就開始\n2. 遇到第一個困難就放棄\n3. 拿自己的第 1 天跟別人的第 5 年比\n\n哪一個正在拖住你？`,
        source: "@mindsetcoach",
        hookType: "錯誤警告 + 數字清單",
        engagement: "38K likes, 2.8K comments",
        whyViral: "用「殘酷真相」製造好奇心，清單結構易讀，結尾問句引發互動",
        adaptationTips: "「殘酷真相」在台灣社群很受歡迎，可以改成「沒人告訴你的真相」增加神秘感",
      },
      {
        originalContent: `I spent $10,000 on courses about ${topic}.\n\nHere's what I'd tell my past self for free:\n\n• Start before you're ready\n• Done > Perfect\n• Your first 100 attempts will suck\n• That's literally how everyone starts\n\nSave your money. Just begin.`,
        translatedContent: `我花了 30 萬上${topic}的課程。\n\n這是我會免費告訴過去的自己的話：\n\n• 在準備好之前就開始\n• 完成 > 完美\n• 你的前 100 次嘗試都會很爛\n• 每個人都是這樣開始的\n\n省下你的錢。直接開始就對了。`,
        source: "@entrepreneurlife",
        hookType: "省時省錢 (Cost-saving revelation)",
        engagement: "52K likes, 4.1K comments",
        whyViral: "用具體金額製造震撼，分享「早知道」的經驗，讀者覺得獲得了免費的價值",
        adaptationTips: "把金額換算成台幣更有感，「30萬」對台灣讀者更有衝擊力",
      },
    ],
    searchQuery: topic,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "請提供搜尋主題" },
        { status: 400 }
      );
    }

    // 檢查 API Key
    if (!PERPLEXITY_API_KEY) {
      console.warn("Perplexity API key not configured, using mock data");
      return NextResponse.json(getMockViralPosts(topic));
    }

    // 建構 Prompt
    const prompt = buildSearchPrompt(topic, category);

    // 呼叫 Perplexity API（使用 sonar 模型進行即時搜尋）
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar", // sonar 模型支援即時網路搜尋
        messages: [
          {
            role: "system",
            content: "You are an expert at finding viral social media content. Search the web for recent viral Threads posts and provide accurate translations. Output only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);

      // API 錯誤時回傳模擬資料
      if (response.status === 401 || response.status === 429) {
        console.warn("Falling back to mock data due to API error");
        return NextResponse.json(getMockViralPosts(topic));
      }

      throw new Error("搜尋服務暫時無法使用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 回應格式錯誤");
    }

    // 解析 JSON 回應
    let result: ViralPostsResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          posts: parsed.posts || [],
          searchQuery: topic,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error("無法解析回應");
      }
    } catch {
      console.error("Failed to parse response:", content);
      return NextResponse.json(getMockViralPosts(topic));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Viral search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "搜尋失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
