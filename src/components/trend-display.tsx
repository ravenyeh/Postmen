"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePostGeneratorStore } from "@/store";
import {
  TrendingUp,
  Newspaper,
  Search,
  Users,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";

interface TrendTagProps {
  text: string;
  onClick: () => void;
}

function TrendTag({ text, onClick }: TrendTagProps) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <span>{text}</span>
      <Plus className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function TrendDisplay() {
  const {
    trends,
    trendsLoading,
    trendsError,
    trendsUpdatedAt,
    fetchTrends,
    setTopic,
    input,
  } = usePostGeneratorStore();

  // 初始載入熱門話題
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleTrendClick = (trend: string) => {
    // 如果主題已有內容，則附加；否則直接設定
    if (input.topic.trim()) {
      setTopic(`${input.topic} ${trend}`);
    } else {
      setTopic(trend);
    }
  };

  const formatUpdatedAt = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (trendsLoading && !trends) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">載入熱門話題中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendsError && !trends) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-destructive">{trendsError}</p>
            <Button variant="outline" size="sm" onClick={() => fetchTrends()}>
              <RefreshCw className="h-4 w-4" />
              重試
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            熱門話題
          </CardTitle>
          <div className="flex items-center gap-2">
            {trendsUpdatedAt && (
              <span className="text-xs text-muted-foreground">
                更新於 {formatUpdatedAt(trendsUpdatedAt)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => fetchTrends()}
              disabled={trendsLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${trendsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="social" className="text-xs">
              <Users className="mr-1 h-3 w-3" />
              社群
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs">
              <Newspaper className="mr-1 h-3 w-3" />
              新聞
            </TabsTrigger>
            <TabsTrigger value="google" className="text-xs">
              <Search className="mr-1 h-3 w-3" />
              搜尋
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {trends?.threads.map((trend, i) => (
                <TrendTag
                  key={i}
                  text={trend}
                  onClick={() => handleTrendClick(trend)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {trends?.news.map((trend, i) => (
                <TrendTag
                  key={i}
                  text={trend}
                  onClick={() => handleTrendClick(trend)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="google" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {trends?.google.map((trend, i) => (
                <TrendTag
                  key={i}
                  text={trend}
                  onClick={() => handleTrendClick(trend)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-3 text-xs text-muted-foreground">
          點擊話題可快速加入主題
        </p>
      </CardContent>
    </Card>
  );
}
