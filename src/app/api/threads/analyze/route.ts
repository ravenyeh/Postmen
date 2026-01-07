import { NextRequest, NextResponse } from "next/server";
import type { ThreadsPostWithInsights } from "@/lib/threads/client";

// Perplexity API 設定
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// 分析結果類型
export interface PostAnalysis {
  postId: string;
  hookType: string; // 開頭句型類型
  hookScore: number; // 開頭吸引力分數 (0-100)
  strengths: string[]; // 優點
  improvements: string[]; // 可改進處
  predictedEngagement: "high" | "medium" | "low";
}

export interface ProfileAnalysis {
  overallScore: number; // 整體表現分數 (0-100)
  contentStyle: string; // 內容風格描述
  strongestPatterns: string[]; // 最強的爆款模式
  weakPatterns: string[]; // 較弱的部分
  recommendations: string[]; // 改進建議
  topPerformingPosts: {
    postId: string;
    reason: string;
  }[];
  postAnalyses: PostAnalysis[];
}

// 請求類型
interface AnalyzeRequest {
  threads: ThreadsPostWithInsights[];
  username?: string;
}

// 建構分析 Prompt
function buildAnalysisPrompt(threads: ThreadsPostWithInsights[]): string {
  const postsData = threads
    .map((t, i) => {
      const engagement = t.insights
        ? `觀看: ${t.insights.views || 0}, 讚: ${t.insights.likes || 0}, 回覆: ${t.insights.replies || 0}, 轉發: ${t.insights.reposts || 0}`
        : "無數據";
      return `【貼文 ${i + 1}】ID: ${t.id}
內容: ${t.text || "(無文字)"}
互動數據: ${engagement}
時間: ${t.timestamp || "未知"}`;
    })
    .join("\n\n");

  return `你是專精 Threads 爆款分析的專家。請分析以下帳號的貼文表現，並給出具體建議。

【已知的 8 種爆款開頭句型】
1. 反常識：你以為（常識）是對的？其實（反直覺結論）才是重點
2. 痛點直擊：如果你也卡在（痛點），先做這 1 件事就好
3. 下斷言：先說結論：在（情境）裡，（做法A）比（做法B）有效 10 倍
4. 對立選邊：關於（議題），只分兩種人：（A）跟（B）。你是哪種？
5. 數字清單：3 個（方法/雷點/原則），讓你在（情境）立刻變好
6. 省時省錢：我用（時間/成本）試出來的：別再（錯誤做法）
7. 錯誤警告：90% 的人做（某事）都錯在第 1 步
8. 問句引戰：為什麼（現象）越努力越沒用？答案其實很簡單

【爆款核心法則】
- 開頭第 1-2 行就要「直奔主題」，用痛點、好奇或反差把人留住
- 不要先鋪陳背景，不要用「大家好」「今天想聊聊」這類開場
- 製造「好奇心差距」：先下斷言，暗示原因在後面
- 用短句、碎段落，讓第一句夠狠、夠清楚

【待分析的貼文】
${postsData}

【任務】
請分析這些貼文，找出：
1. 哪些貼文使用了爆款技巧（以及使用得好不好）
2. 整體內容風格是什麼
3. 表現最好的貼文有什麼共同點
4. 可以改進的地方

【輸出格式】
請以 JSON 格式輸出：
{
  "overallScore": 75,
  "contentStyle": "以個人經驗分享為主，風格偏向輕鬆幽默",
  "strongestPatterns": ["反常識", "數字清單"],
  "weakPatterns": ["開頭不夠直接", "缺少問句互動"],
  "recommendations": [
    "建議第一句更有衝擊力",
    "可以多用對立選邊製造討論"
  ],
  "topPerformingPosts": [
    {
      "postId": "xxx",
      "reason": "使用反常識開頭，成功製造好奇心"
    }
  ],
  "postAnalyses": [
    {
      "postId": "xxx",
      "hookType": "反常識",
      "hookScore": 85,
      "strengths": ["開頭直接有力", "有個人經驗佐證"],
      "improvements": ["可以加上互動問句"],
      "predictedEngagement": "high"
    }
  ]
}

只輸出 JSON，不要有其他文字。`;
}

// 模擬分析結果
function getMockAnalysis(threads: ThreadsPostWithInsights[]): ProfileAnalysis {
  const postAnalyses: PostAnalysis[] = threads.slice(0, 5).map((thread, i) => {
    const hookTypes = ["反常識", "對立選邊", "數字清單", "下斷言", "錯誤警告"];
    const engagementLevels: ("high" | "medium" | "low")[] = ["high", "high", "medium", "medium", "low"];

    return {
      postId: thread.id,
      hookType: hookTypes[i % hookTypes.length],
      hookScore: 90 - i * 5,
      strengths: [
        "開頭第一句就抓住注意力",
        "使用短句增加可讀性",
        i < 2 ? "成功製造好奇心差距" : "有個人經驗佐證",
      ],
      improvements: [
        i > 2 ? "開頭可以更直接" : "可以加入更多互動元素",
        "適當加入 emoji 增加視覺效果",
      ],
      predictedEngagement: engagementLevels[i],
    };
  });

  // 根據 insights 找出表現最好的貼文
  const sortedByEngagement = [...threads]
    .filter((t) => t.insights?.views)
    .sort((a, b) => (b.insights?.views || 0) - (a.insights?.views || 0));

  const topPerformingPosts = sortedByEngagement.slice(0, 3).map((post, i) => ({
    postId: post.id,
    reason:
      i === 0
        ? "使用「錯誤警告」句型，用數據製造緊張感成功引發共鳴"
        : i === 1
          ? "「對立選邊」製造認同感，引發大量討論"
          : "「數字清單」提供具體價值，分享率高",
  }));

  return {
    overallScore: 78,
    contentStyle: "以個人經驗分享為主，風格偏向實用乾貨型，善用數據和清單整理觀點",
    strongestPatterns: ["錯誤警告", "對立選邊", "數字清單"],
    weakPatterns: ["較少使用問句互動", "部分開頭稍嫌平淡"],
    recommendations: [
      "開頭第一句可以更有衝擊力，多用「反常識」或「錯誤警告」句型",
      "增加問句結尾引發討論，如「你是哪種？」「中了幾個？」",
      "善用「省時省錢」句型分享個人試錯經驗，更有說服力",
      "適當使用 emoji 增加視覺吸引力，但不要過量",
    ],
    topPerformingPosts,
    postAnalyses,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { threads } = body;

    if (!threads || !Array.isArray(threads) || threads.length === 0) {
      return NextResponse.json(
        { error: "請提供貼文資料進行分析" },
        { status: 400 }
      );
    }

    // 限制分析數量
    const threadsToAnalyze = threads.slice(0, 20);

    // 檢查 API Key
    if (!PERPLEXITY_API_KEY) {
      console.warn("Perplexity API key not configured, using mock analysis");
      return NextResponse.json(getMockAnalysis(threadsToAnalyze));
    }

    // 建構 Prompt
    const prompt = buildAnalysisPrompt(threadsToAnalyze);

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
            content:
              "你是專精 Threads 爆款貼文分析的專家。請只輸出 JSON 格式的回應。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // 分析用較低 temperature
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);

      if (response.status === 401 || response.status === 429) {
        console.warn("Falling back to mock analysis due to API error");
        return NextResponse.json(getMockAnalysis(threadsToAnalyze));
      }

      throw new Error("AI 分析服務暫時無法使用");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 回應格式錯誤");
    }

    // 解析 JSON 回應
    let analysis: ProfileAnalysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("無法解析 AI 回應");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      // 解析失敗時使用模擬資料
      return NextResponse.json(getMockAnalysis(threadsToAnalyze));
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
