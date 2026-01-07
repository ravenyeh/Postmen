"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Globe,
  Loader2,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Languages,
  Lightbulb,
  Heart,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import type { ViralPost, ViralPostsResponse } from "@/app/api/viral/search/route";
import type { AdaptedPost, AdaptResponse } from "@/app/api/viral/adapt/route";

type ExplorerState = "idle" | "searching" | "adapting" | "done" | "error";

// 熱門搜尋類別
const POPULAR_CATEGORIES = [
  { id: "productivity", label: "生產力", icon: "⚡" },
  { id: "career", label: "職涯", icon: "💼" },
  { id: "mindset", label: "心態", icon: "🧠" },
  { id: "tech", label: "科技", icon: "💻" },
  { id: "finance", label: "理財", icon: "💰" },
  { id: "relationships", label: "人際", icon: "🤝" },
];

export function ViralExplorer() {
  const [state, setState] = useState<ExplorerState>("idle");
  const [searchTopic, setSearchTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viralPosts, setViralPosts] = useState<ViralPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ViralPost | null>(null);
  const [adaptedPosts, setAdaptedPosts] = useState<AdaptedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 搜尋國外爆款
  const searchViralPosts = async () => {
    if (!searchTopic.trim()) return;

    setState("searching");
    setError(null);
    setViralPosts([]);
    setSelectedPost(null);
    setAdaptedPosts([]);

    try {
      const response = await fetch("/api/viral/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: searchTopic,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        throw new Error("搜尋失敗");
      }

      const data: ViralPostsResponse = await response.json();
      setViralPosts(data.posts || []);
      setState("done");
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "搜尋失敗");
      setState("error");
    }
  };

  // 改編選中的貼文
  const adaptPost = async (post: ViralPost) => {
    setSelectedPost(post);
    setState("adapting");
    setAdaptedPosts([]);

    try {
      const response = await fetch("/api/viral/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalContent: post.originalContent,
          translatedContent: post.translatedContent,
          hookType: post.hookType,
          userTopic: customTopic || undefined,
          includeEmoji,
        }),
      });

      if (!response.ok) {
        throw new Error("改編失敗");
      }

      const data: AdaptResponse = await response.json();
      setAdaptedPosts(data.posts || []);
      setState("done");
    } catch (err) {
      console.error("Adapt failed:", err);
      setError(err instanceof Error ? err.message : "改編失敗");
      setState("error");
    }
  };

  // 複製貼文
  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // 快速選擇類別
  const handleCategoryClick = (categoryId: string, label: string) => {
    setSelectedCategory(categoryId);
    setSearchTopic(label);
  };

  return (
    <div className="space-y-6">
      {/* 搜尋區域 */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">國外爆款探索</h3>
            <p className="text-sm text-muted-foreground">
              搜尋國外熱門貼文，AI 翻譯改編成中文
            </p>
          </div>
        </div>

        {/* 快速類別 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id, cat.label)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 搜尋輸入 */}
        <div className="flex gap-2">
          <Input
            placeholder="輸入想搜尋的主題，如：time management, productivity..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchViralPosts()}
            className="flex-1"
          />
          <Button
            onClick={searchViralPosts}
            disabled={!searchTopic.trim() || state === "searching"}
            className="gap-2"
          >
            {state === "searching" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            搜尋
          </Button>
        </div>
      </Card>

      {/* 錯誤提示 */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null);
              setState("idle");
            }}
          >
            重試
          </Button>
        </Card>
      )}

      {/* 載入中 */}
      {(state === "searching" || state === "adapting") && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">
            {state === "searching"
              ? "正在搜尋國外爆款貼文..."
              : "AI 正在改編成中文版本..."}
          </p>
        </Card>
      )}

      {/* 爆款貼文列表 */}
      {viralPosts.length > 0 && !selectedPost && state === "done" && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            找到 {viralPosts.length} 則國外爆款貼文
          </h4>

          {viralPosts.map((post, index) => (
            <Card
              key={index}
              className={`p-4 cursor-pointer transition-all ${
                expandedPost === index ? "ring-2 ring-primary" : "hover:border-primary/50"
              }`}
              onClick={() => setExpandedPost(expandedPost === index ? null : index)}
            >
              {/* 標題列 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {post.hookType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.source}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2 whitespace-pre-line">
                    {post.originalContent}
                  </p>
                </div>
                {expandedPost === index ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {/* 互動數據 */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <MessageCircle className="w-3 h-3" />
                  {post.engagement}
                </span>
              </div>

              {/* 展開內容 */}
              {expandedPost === index && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* 原文 */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      原文 (English)
                    </Label>
                    <p className="text-sm whitespace-pre-line bg-muted/50 p-3 rounded">
                      {post.originalContent}
                    </p>
                  </div>

                  {/* 翻譯 */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Languages className="w-3 h-3" />
                      直譯版本
                    </Label>
                    <p className="text-sm whitespace-pre-line bg-muted/50 p-3 rounded">
                      {post.translatedContent}
                    </p>
                  </div>

                  {/* 爆款分析 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-amber-50 rounded">
                      <Label className="text-xs text-amber-700 mb-1 block flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        爆款原因
                      </Label>
                      <p className="text-sm text-amber-900">{post.whyViral}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <Label className="text-xs text-green-700 mb-1 block flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        在地化建議
                      </Label>
                      <p className="text-sm text-green-900">{post.adaptationTips}</p>
                    </div>
                  </div>

                  {/* 改編選項 */}
                  <div className="p-3 bg-primary/5 rounded space-y-3">
                    <Label className="text-sm font-medium">改編設定</Label>
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          換成你的主題（選填）
                        </Label>
                        <Input
                          placeholder="例如：學英文、投資理財、健身..."
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">加入 Emoji</Label>
                        <Switch
                          checked={includeEmoji}
                          onCheckedChange={setIncludeEmoji}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        adaptPost(post);
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI 改編成中文版本
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 改編結果 */}
      {selectedPost && adaptedPosts.length > 0 && state === "done" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              改編結果
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPost(null);
                setAdaptedPosts([]);
              }}
            >
              返回搜尋
            </Button>
          </div>

          {/* 原始參考 */}
          <Card className="p-3 bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-1 block">
              原始爆款參考
            </Label>
            <p className="text-sm whitespace-pre-line line-clamp-3">
              {selectedPost.originalContent}
            </p>
          </Card>

          {/* 改編版本 */}
          {adaptedPosts.map((post, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  版本 {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => copyToClipboard(post.content, index)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      複製
                    </>
                  )}
                </Button>
              </div>

              {/* 貼文內容 */}
              <p className="text-sm whitespace-pre-line mb-3">{post.content}</p>

              {/* 標籤 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {post.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 改編說明 */}
              <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">保留結構：</span>
                  {post.originalStructure}
                </p>
                <p>
                  <span className="font-medium">改編重點：</span>
                  {post.adaptationNotes}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空狀態 */}
      {state === "idle" && viralPosts.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">輸入主題搜尋國外爆款貼文</p>
          <p className="text-xs mt-1">AI 會幫你翻譯並改編成適合台灣讀者的版本</p>
        </Card>
      )}
    </div>
  );
}
