import { PostForm } from "@/components/post-form";
import { PostPreview } from "@/components/post-preview";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="threads-gradient rounded-lg p-2 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.123 3.479-1.142.987-.014 1.95.125 2.716.328l.026-.013c-.007-.04-.015-.08-.024-.12-.173-.858-.49-1.504-.944-1.923-.519-.479-1.25-.73-2.172-.747h-.008c-.746.013-1.697.197-2.478.862l-1.305-1.543c1.166-.987 2.575-1.443 3.782-1.454h.013c1.424.022 2.595.475 3.479 1.346.758.748 1.266 1.749 1.512 2.975.077.385.132.785.164 1.19 1.21.511 2.18 1.29 2.817 2.293.893 1.407 1.033 3.155.394 4.929-.91 2.522-3.243 4.188-6.85 4.205h-.016zm-1.055-9.96c-1.097.013-1.995.27-2.538.727-.493.413-.734.933-.7 1.505.036.628.371 1.147.944 1.461.582.318 1.325.448 2.097.412 1.105-.058 1.948-.476 2.507-1.241.322-.442.523-.947.634-1.559-.71-.178-1.683-.326-2.944-.305z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Threads 貼文產生器</h1>
              <p className="text-sm text-muted-foreground">
                AI 驅動的高流量貼文創作工具
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* 左側：輸入表單 */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PostForm />
          </aside>

          {/* 右側：結果展示 */}
          <section className="min-h-[400px]">
            <PostPreview />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Threads Post Generator - AI 驅動的社群貼文創作工具
          </p>
        </div>
      </footer>
    </div>
  );
}
