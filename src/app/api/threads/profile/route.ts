import { NextRequest, NextResponse } from "next/server";
import {
  createThreadsClient,
  ThreadsProfile,
  ThreadsPostWithInsights,
  ThreadsApiError,
} from "@/lib/threads/client";

// 回應類型
export interface ThreadsProfileResponse {
  profile: ThreadsProfile;
  threads: ThreadsPostWithInsights[];
  accountInsights?: {
    followers_count?: number;
    total_views?: number;
  };
}

// 模擬資料（當沒有 API token 時使用）
function getMockData(): ThreadsProfileResponse {
  return {
    profile: {
      id: "mock_user_123",
      username: "demo_user",
      name: "示範帳號",
      threads_biography: "這是一個示範帳號，用於展示 Threads 分析功能。請設定 THREADS_ACCESS_TOKEN 環境變數以使用真實 API。",
      threads_profile_picture_url: undefined,
    },
    threads: [
      {
        id: "mock_thread_1",
        text: "你以為早起就會成功？\n\n錯。我 5 點起床三個月才發現：\n\n重點不是幾點起\n是起來之後做什麼\n\n（現在改成 7 點起，效率反而更好）",
        media_type: "TEXT_POST",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        username: "demo_user",
        permalink: "https://threads.net/@demo_user/post/mock1",
        is_quote_post: false,
        insights: {
          views: 15234,
          likes: 892,
          replies: 156,
          reposts: 234,
          quotes: 45,
        },
      },
      {
        id: "mock_thread_2",
        text: "關於遠距工作，只分兩種人：\n\n一種把家當辦公室\n一種把辦公室帶回家\n\n差別在於：有沒有「下班儀式」\n\n你是哪種？",
        media_type: "TEXT_POST",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        username: "demo_user",
        permalink: "https://threads.net/@demo_user/post/mock2",
        is_quote_post: false,
        insights: {
          views: 28456,
          likes: 1567,
          replies: 423,
          reposts: 567,
          quotes: 89,
        },
      },
      {
        id: "mock_thread_3",
        text: "3 個新手投資最常犯的錯：\n\n1. 聽到什麼買什麼\n2. 跌了就慌賣\n3. 只看報酬不看風險\n\n中了幾個？\n\n（我全中過）",
        media_type: "TEXT_POST",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        username: "demo_user",
        permalink: "https://threads.net/@demo_user/post/mock3",
        is_quote_post: false,
        insights: {
          views: 42890,
          likes: 2341,
          replies: 678,
          reposts: 890,
          quotes: 123,
        },
      },
      {
        id: "mock_thread_4",
        text: "先說結論：\n\n在學習新技能這件事上\n「持續 30 分鐘」比「偶爾 3 小時」有效 10 倍\n\n大腦記得的是頻率，不是長度",
        media_type: "TEXT_POST",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        username: "demo_user",
        permalink: "https://threads.net/@demo_user/post/mock4",
        is_quote_post: false,
        insights: {
          views: 31567,
          likes: 1890,
          replies: 345,
          reposts: 456,
          quotes: 78,
        },
      },
      {
        id: "mock_thread_5",
        text: "90% 的人做時間管理都錯在第 1 步\n\n不是不會安排\n是根本不知道時間花去哪了\n\n試試這週記錄每小時在做什麼\n答案會嚇到你",
        media_type: "TEXT_POST",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        username: "demo_user",
        permalink: "https://threads.net/@demo_user/post/mock5",
        is_quote_post: false,
        insights: {
          views: 56789,
          likes: 3456,
          replies: 890,
          reposts: 1234,
          quotes: 234,
        },
      },
    ],
    accountInsights: {
      followers_count: 12500,
      total_views: 850000,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // 從 query 取得參數
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "25", 10),
      100
    );

    // 嘗試建立 API 客戶端
    const client = createThreadsClient();

    if (!client) {
      console.warn(
        "THREADS_ACCESS_TOKEN not configured, using mock data"
      );
      return NextResponse.json(getMockData());
    }

    // 取得真實資料
    const [profile, threads, accountInsights] = await Promise.all([
      client.getProfile(),
      client.getThreadsWithInsights("me", limit),
      client.getAccountInsights(),
    ]);

    const response: ThreadsProfileResponse = {
      profile,
      threads,
      accountInsights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch Threads profile:", error);

    if (error instanceof ThreadsApiError) {
      // API 錯誤時回傳模擬資料
      if (error.code === 190 || error.code === 102) {
        // Token 過期或無效
        console.warn("Access token invalid or expired, using mock data");
        return NextResponse.json(getMockData());
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    // 其他錯誤回傳模擬資料
    console.warn("Unexpected error, using mock data");
    return NextResponse.json(getMockData());
  }
}
