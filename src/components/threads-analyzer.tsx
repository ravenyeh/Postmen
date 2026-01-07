"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  User,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Lightbulb,
  Target,
  ArrowRight,
} from "lucide-react";
import type { ThreadsPostWithInsights } from "@/lib/threads/client";
import type { ThreadsProfileResponse } from "@/app/api/threads/profile/route";
import type { ProfileAnalysis, PostAnalysis } from "@/app/api/threads/analyze/route";

type AnalysisState = "idle" | "fetching" | "analyzing" | "done" | "error";

export function ThreadsAnalyzer() {
  const [state, setState] = useState<AnalysisState>("idle");
  const [profileData, setProfileData] = useState<ThreadsProfileResponse | null>(null);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const fetchAndAnalyze = async () => {
    setState("fetching");
    setError(null);

    try {
      // 取得 Threads 資料
      const profileRes = await fetch("/api/threads/profile?limit=20");
      if (!profileRes.ok) {
        throw new Error("無法取得 Threads 資料");
      }
      const profile: ThreadsProfileResponse = await profileRes.json();
      setProfileData(profile);

      // 分析貼文
      setState("analyzing");
      const analyzeRes = await fetch("/api/threads/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threads: profile.threads }),
      });

      if (!analyzeRes.ok) {
        throw new Error("分析失敗");
      }

      const analysisResult: ProfileAnalysis = await analyzeRes.json();
      setAnalysis(analysisResult);
      setState("done");
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : "發生未知錯誤");
      setState("error");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}萬`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "剛剛";
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString("zh-TW");
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getEngagementBadge = (level: "high" | "medium" | "low") => {
    const styles = {
      high: "bg-green-100 text-green-700",
      medium: "bg-amber-100 text-amber-700",
      low: "bg-gray-100 text-gray-600",
    };
    const labels = { high: "高", medium: "中", low: "低" };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${styles[level]}`}>
        預測互動: {labels[level]}
      </span>
    );
  };

  const getPostAnalysis = (postId: string): PostAnalysis | undefined => {
    return analysis?.postAnalyses.find((p) => p.postId === postId);
  };

  // 初始狀態
  if (state === "idle") {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Threads 帳號分析</h3>
            <p className="text-sm text-muted-foreground mt-1">
              使用 Meta Graph API 取得你的 Threads 貼文，讓 AI 分析爆款模式
            </p>
          </div>
          <Button onClick={fetchAndAnalyze} className="gap-2">
            <Search className="w-4 h-4" />
            開始分析
          </Button>
          <p className="text-xs text-muted-foreground">
            需要設定 THREADS_ACCESS_TOKEN 環境變數，否則會使用示範資料
          </p>
        </div>
      </Card>
    );
  }

  // 載入中
  if (state === "fetching" || state === "analyzing") {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {state === "fetching" ? "正在取得 Threads 資料..." : "AI 正在分析貼文模式..."}
          </p>
        </div>
      </Card>
    );
  }

  // 錯誤狀態
  if (state === "error") {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchAndAnalyze}>
            重試
          </Button>
        </div>
      </Card>
    );
  }

  // 分析結果
  return (
    <div className="space-y-6">
      {/* 帳號資訊 */}
      {profileData && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">@{profileData.profile.username}</h3>
              {profileData.profile.threads_biography && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {profileData.profile.threads_biography}
                </p>
              )}
            </div>
            {profileData.accountInsights && (
              <div className="text-right text-sm">
                <div className="font-medium">
                  {formatNumber(profileData.accountInsights.followers_count || 0)} 粉絲
                </div>
                <div className="text-muted-foreground">
                  {formatNumber(profileData.accountInsights.total_views || 0)} 總觀看
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 總體分析 */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 整體評分 */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h4 className="font-medium">整體評分</h4>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}
              >
                {analysis.overallScore}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${analysis.overallScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.contentStyle}
                </p>
              </div>
            </div>
          </Card>

          {/* 優勢模式 */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-medium">優勢爆款模式</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.strongestPatterns.map((pattern, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm"
                >
                  {pattern}
                </span>
              ))}
            </div>
            {analysis.weakPatterns.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">可加強：</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.weakPatterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 改進建議 */}
      {analysis && analysis.recommendations.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-medium">AI 改進建議</h4>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 表現最好的貼文 */}
      {analysis && analysis.topPerformingPosts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium">表現最佳貼文</h4>
          </div>
          <div className="space-y-3">
            {analysis.topPerformingPosts.map((top, i) => {
              const post = profileData?.threads.find((t) => t.id === top.postId);
              return (
                <div
                  key={i}
                  className="p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  {post && (
                    <p className="text-sm line-clamp-2 mb-2">{post.text}</p>
                  )}
                  <p className="text-xs text-green-700">{top.reason}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 貼文列表與個別分析 */}
      {profileData && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">貼文分析</h4>
            <span className="text-sm text-muted-foreground">
              共 {profileData.threads.length} 則貼文
            </span>
          </div>
          <div className="space-y-4">
            {profileData.threads.map((thread) => {
              const postAnalysis = getPostAnalysis(thread.id);
              const isSelected = selectedPost === thread.id;

              return (
                <div
                  key={thread.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setSelectedPost(isSelected ? null : thread.id)}
                >
                  {/* 貼文內容 */}
                  <p className="text-sm whitespace-pre-line line-clamp-3">
                    {thread.text}
                  </p>

                  {/* 互動數據 */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(thread.insights?.views || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(thread.insights?.likes || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(thread.insights?.replies || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {formatNumber(thread.insights?.reposts || 0)}
                    </span>
                    <span className="ml-auto">
                      {thread.timestamp && formatDate(thread.timestamp)}
                    </span>
                  </div>

                  {/* 展開的分析內容 */}
                  {isSelected && postAnalysis && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {postAnalysis.hookType}
                        </span>
                        <span className="text-xs">
                          開頭吸引力:{" "}
                          <span className={getScoreColor(postAnalysis.hookScore)}>
                            {postAnalysis.hookScore}分
                          </span>
                        </span>
                        {getEngagementBadge(postAnalysis.predictedEngagement)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-green-700 mb-1">優點</p>
                          <ul className="space-y-1 text-muted-foreground">
                            {postAnalysis.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-amber-700 mb-1">可改進</p>
                          <ul className="space-y-1 text-muted-foreground">
                            {postAnalysis.improvements.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 重新分析按鈕 */}
      <div className="text-center">
        <Button variant="outline" onClick={fetchAndAnalyze} className="gap-2">
          <Search className="w-4 h-4" />
          重新分析
        </Button>
      </div>
    </div>
  );
}
