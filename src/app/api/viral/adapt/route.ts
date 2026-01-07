import { NextRequest, NextResponse } from "next/server";

// Perplexity API 設定
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// 改編後的貼文
export interface AdaptedPost {
  content: string;
  originalStructure: string;
  adaptationNotes: string;
  hashtags: string[];
}

export interface AdaptResponse {
  posts: AdaptedPost[];
}

// 請求類型
interface AdaptRequest {
  originalContent: string;
  translatedContent: string;
  hookType: string;
  userTopic?: string; // 用戶想改成的主題
  userPersona?: string; // 用戶的身份定位
  includeEmoji?: boolean;
}

// 建構改編 Prompt
function buildAdaptPrompt(request: AdaptRequest): string {
  const { originalContent, translatedContent, hookType, userTopic, userPersona, includeEmoji } = request;

  return `你是專精 Threads 爆款改編的文案專家。

【原始爆款貼文（英文）】
${originalContent}

【直譯版本】
${translatedContent}

【爆款句型】
${hookType}

【改編任務】
請根據這則爆款貼文的結構和句型，創作 3 個適合台灣讀者的繁體中文版本：

${userTopic ? `- 主題改為：${userTopic}` : "- 保持原主題但更在地化"}
${userPersona ? `- 說話的人是：${userPersona}` : "- 用一般社群用戶的口吻"}
- Emoji：${includeEmoji ? "適當使用" : "不使用"}

【改編原則】
1. 保留原文的爆款結構（開頭句型、節奏、轉折）
2. 用台灣人說話的方式，不是翻譯腔
3. 把例子、數字、情境換成台灣讀者有感的版本
4. 保持第一句的吸引力，開頭要夠狠
5. 每個版本切入角度要不同

【輸出格式】
{
  "posts": [
    {
      "content": "改編後的貼文內容",
      "originalStructure": "說明保留了原文的什麼結構",
      "adaptationNotes": "改編重點和在地化處理",
      "hashtags": ["#建議標籤1", "#建議標籤2"]
    }
  ]
}

只輸出 JSON，不要有其他文字。`;
}

// 模擬改編結果
function getMockAdaptation(request: AdaptRequest): AdaptResponse {
  const topic = request.userTopic || "這個主題";
  const useEmoji = request.includeEmoji;

  return {
    posts: [
      {
        content: useEmoji
          ? `不受歡迎的觀點 💭\n\n你不需要每天加班才能升遷。\n\n我拼了 2 年才發現：\n\n→ 效率 > 時數\n→ 被看見 > 埋頭苦幹\n→ 解決對的問題比解決很多問題重要\n\n別再用時間換升遷了。用腦袋。`
          : `不受歡迎的觀點：\n\n你不需要每天加班才能升遷。\n\n我拼了 2 年才發現：\n\n→ 效率 > 時數\n→ 被看見 > 埋頭苦幹\n→ 解決對的問題比解決很多問題重要\n\n別再用時間換升遷了。用腦袋。`,
        originalStructure: "反常識開頭 + 個人經驗 + 三點清單 + 結尾金句",
        adaptationNotes: "把「5am起床」換成台灣職場更有感的「加班文化」，三點清單改成職場升遷相關",
        hashtags: ["#職場", "#升遷", "#工作效率"],
      },
      {
        content: useEmoji
          ? `說一個大家不想承認的事 🙊\n\n${topic}失敗的人\n不是不夠努力\n\n是努力錯地方了：\n\n❌ 花 80% 時間在不重要的事\n❌ 一直學但從不開始做\n❌ 追求完美所以永遠沒開始\n\n你中了幾個？`
          : `說一個大家不想承認的事：\n\n${topic}失敗的人\n不是不夠努力\n\n是努力錯地方了：\n\n• 花 80% 時間在不重要的事\n• 一直學但從不開始做\n• 追求完美所以永遠沒開始\n\n你中了幾個？`,
        originalStructure: "反常識開頭 + 痛點清單 + 互動問句",
        adaptationNotes: "保留反常識結構，用清單列出常見錯誤，結尾問句增加互動",
        hashtags: ["#成長", "#自我反省", "#真相"],
      },
      {
        content: useEmoji
          ? `我花了一年才搞懂的事 📝\n\n關於${topic}：\n\n不用準備好才開始\n不用很厲害才能教人\n不用完美才能發布\n\n你只需要：\n比昨天的自己好一點點就夠了\n\n（這段話是說給我自己聽的）`
          : `我花了一年才搞懂的事：\n\n關於${topic}：\n\n不用準備好才開始\n不用很厲害才能教人\n不用完美才能發布\n\n你只需要：\n比昨天的自己好一點點就夠了\n\n（這段話是說給我自己聽的）`,
        originalStructure: "時間成本開頭 + 排比否定句 + 正向結論 + 自嘲結尾",
        adaptationNotes: "用「花了一年」製造說服力，排比句增加節奏感，自嘲結尾增加親和力",
        hashtags: ["#人生體悟", "#成長心態", "#共勉"],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AdaptRequest = await request.json();

    if (!body.originalContent || !body.translatedContent) {
      return NextResponse.json(
        { error: "請提供原始貼文和翻譯內容" },
        { status: 400 }
      );
    }

    // 檢查 API Key
    if (!PERPLEXITY_API_KEY) {
      console.warn("Perplexity API key not configured, using mock data");
      return NextResponse.json(getMockAdaptation(body));
    }

    // 建構 Prompt
    const prompt = buildAdaptPrompt(body);

    // 呼叫 Perplexity API
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "你是專精台灣社群文案的爆款改編專家。請只輸出 JSON 格式的回應。",
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

      if (response.status === 401 || response.status === 429) {
        console.warn("Falling back to mock data");
        return NextResponse.json(getMockAdaptation(body));
      }

      throw new Error("改編服務暫時無法使用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 回應格式錯誤");
    }

    // 解析 JSON 回應
    let result: AdaptResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("無法解析回應");
      }
    } catch {
      console.error("Failed to parse response:", content);
      return NextResponse.json(getMockAdaptation(body));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Adapt error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "改編失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
