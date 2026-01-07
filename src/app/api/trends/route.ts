import { NextResponse } from "next/server";
import { fetchAllTrends } from "@/lib/trends/sources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const trends = await fetchAllTrends();

    return NextResponse.json({
      threads: trends.social,  // 社群熱門（對應規格中的 threads）
      google: trends.google,
      news: trends.news,
      updatedAt: trends.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch trends:", error);

    // 返回備援資料
    return NextResponse.json({
      threads: ["AI 工具", "遠距工作", "躺平文化"],
      google: ["台積電", "股市", "天氣"],
      news: ["科技業動態", "年終獎金", "創業趨勢"],
      updatedAt: new Date().toISOString(),
      error: "部分資料來源暫時無法取得",
    });
  }
}
