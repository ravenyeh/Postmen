"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePostGeneratorStore } from "@/store";
import { TEMPLATE_LABELS, type GeneratedPost } from "@/types";
import {
  Copy,
  Clock,
  Hash,
  TrendingUp,
  Heart,
  Share2,
  Timer,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface ScoreBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function ScoreBar({ label, value, icon, color }: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{
            width: `${value}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

interface PostCardProps {
  post: GeneratedPost;
  index: number;
}

function PostCard({ post, index }: PostCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = post.hashtags.length > 0
        ? `${post.content}\n\n${post.hashtags.join(" ")}`
        : post.content;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("複製失敗");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(142, 76%, 36%)"; // green
    if (score >= 60) return "hsl(48, 96%, 53%)"; // yellow
    return "hsl(0, 84%, 60%)"; // red
  };

  return (
    <Card className="post-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            版本 {index + 1} - {TEMPLATE_LABELS[post.template]}
          </CardTitle>
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white"
            style={{ background: getScoreColor(post.score.overall) }}
          >
            <TrendingUp className="h-3 w-3" />
            {post.score.overall}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 貼文內容 */}
        <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
          {post.content}
        </div>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                <Hash className="h-3 w-3" />
                {tag.replace("#", "")}
              </span>
            ))}
          </div>
        )}

        {/* 建議發文時間 */}
        {post.suggestedTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            建議發文時間: {post.suggestedTime}
          </div>
        )}

        {/* 評分詳情 */}
        <div className="space-y-2 rounded-lg bg-muted/30 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            互動潛力分析
          </div>
          <ScoreBar
            label="情緒共鳴"
            value={post.score.emotional}
            icon={<Heart className="h-3 w-3" />}
            color="hsl(330, 80%, 60%)"
          />
          <ScoreBar
            label="可分享性"
            value={post.score.shareability}
            icon={<Share2 className="h-3 w-3" />}
            color="hsl(262, 83%, 58%)"
          />
          <ScoreBar
            label="時效性"
            value={post.score.timeliness}
            icon={<Timer className="h-3 w-3" />}
            color="hsl(200, 80%, 50%)"
          />
        </div>

        {/* 複製按鈕 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
          {copied ? "已複製!" : "複製貼文"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PostPreview() {
  const { posts, trendsUsed, isLoading, error } = usePostGeneratorStore();

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-primary/40" />
              <div className="absolute inset-4 rounded-full bg-primary" />
            </div>
            <p className="text-sm text-muted-foreground">AI 正在創作中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="threads-gradient rounded-full p-3 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-medium">準備好創作爆款貼文了嗎?</h3>
            <p className="text-sm text-muted-foreground">
              輸入你的主題或靈感，讓 AI 幫你生成多個版本的貼文
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 使用的熱門話題 */}
      {trendsUsed.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">結合熱門話題:</span>
              <span className="font-medium text-primary">
                {trendsUsed.join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 貼文列表 */}
      <div className="grid gap-4">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </div>
  );
}
