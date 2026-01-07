"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePostGeneratorStore } from "@/store";
import {
  PERSONA_LABELS,
  TONE_LABELS,
  LENGTH_LABELS,
  type Persona,
  type Tone,
  type Length,
} from "@/types";
import { Sparkles, Loader2 } from "lucide-react";

export function PostForm() {
  const {
    input,
    isLoading,
    setTopic,
    setPersona,
    setTone,
    setLength,
    setIncludeEmoji,
    setIncludeTrend,
    setVariations,
    generatePosts,
  } = usePostGeneratorStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generatePosts();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          貼文產生器
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 主題輸入 */}
          <div className="space-y-2">
            <Label htmlFor="topic">主題 / 靈感</Label>
            <Input
              id="topic"
              placeholder="例如：週一症候群、創業心得、健身日常..."
              value={input.topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* 身份定位 */}
          <div className="space-y-2">
            <Label htmlFor="persona">身份定位</Label>
            <Select
              value={input.persona}
              onValueChange={(value) => setPersona(value as Persona)}
              disabled={isLoading}
            >
              <SelectTrigger id="persona">
                <SelectValue placeholder="選擇身份" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERSONA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 語氣風格 */}
          <div className="space-y-2">
            <Label htmlFor="tone">語氣風格</Label>
            <Select
              value={input.tone}
              onValueChange={(value) => setTone(value as Tone)}
              disabled={isLoading}
            >
              <SelectTrigger id="tone">
                <SelectValue placeholder="選擇語氣" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TONE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 長度偏好 */}
          <div className="space-y-2">
            <Label htmlFor="length">長度偏好</Label>
            <Select
              value={input.length}
              onValueChange={(value) => setLength(value as Length)}
              disabled={isLoading}
            >
              <SelectTrigger id="length">
                <SelectValue placeholder="選擇長度" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LENGTH_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 生成數量 */}
          <div className="space-y-2">
            <Label htmlFor="variations">生成數量</Label>
            <Select
              value={input.variations.toString()}
              onValueChange={(value) => setVariations(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger id="variations">
                <SelectValue placeholder="選擇數量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 個版本</SelectItem>
                <SelectItem value="2">2 個版本</SelectItem>
                <SelectItem value="3">3 個版本</SelectItem>
                <SelectItem value="5">5 個版本</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 開關選項 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emoji" className="cursor-pointer">
                使用 Emoji
              </Label>
              <Switch
                id="emoji"
                checked={input.includeEmoji}
                onCheckedChange={setIncludeEmoji}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="trend" className="cursor-pointer">
                結合熱門話題
              </Label>
              <Switch
                id="trend"
                checked={input.includeTrend}
                onCheckedChange={setIncludeTrend}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 送出按鈕 */}
          <Button
            type="submit"
            className="w-full threads-gradient text-white"
            disabled={isLoading || !input.topic.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成貼文
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
