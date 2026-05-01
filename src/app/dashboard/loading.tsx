export default function Loading() {
  return (
    <div className="min-h-screen flex bg-bg-primary text-text-primary">
      <aside className="hidden xl:flex w-64 border-r border-border-dim bg-bg-tertiary flex-col p-4 gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-border-mid animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-28 rounded-full bg-border-mid animate-pulse" />
            <div className="h-2 w-20 rounded-full bg-border-mid/70 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-bg-secondary border border-border-dim animate-pulse" />
          ))}
        </div>

        <div className="mt-auto space-y-3">
          <div className="h-16 rounded-xl bg-bg-secondary border border-border-dim animate-pulse" />
          <div className="h-20 rounded-xl bg-bg-secondary border border-border-dim animate-pulse" />
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 border-b border-border-dim bg-bg-primary/90 backdrop-blur px-3 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-border-mid animate-pulse" />
            <div className="h-7 w-56 rounded-full bg-border-mid/80 animate-pulse" />
            <div className="h-3 w-72 max-w-full rounded-full bg-border-mid/60 animate-pulse" />
          </div>

          <div className="hidden md:flex items-center gap-3 w-full max-w-3xl justify-end">
            <div className="h-10 w-80 rounded-xl bg-bg-secondary border border-border-dim animate-pulse" />
            <div className="h-10 w-10 rounded-xl bg-bg-secondary border border-border-dim animate-pulse" />
            <div className="h-10 w-32 rounded-xl bg-accent-green/30 border border-border-dim animate-pulse" />
            <div className="h-10 w-16 rounded-xl bg-bg-secondary border border-border-dim animate-pulse" />
          </div>
        </header>

        <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border-dim bg-bg-secondary p-4 space-y-3 animate-pulse">
                <div className="h-3 w-32 rounded-full bg-border-mid" />
                <div className="h-10 w-16 rounded-full bg-border-mid/80" />
                <div className="h-3 w-40 rounded-full bg-border-mid/60" />
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-border-dim bg-bg-secondary p-5 space-y-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded-full bg-border-mid" />
                  <div className="h-7 w-52 rounded-full bg-border-mid/80" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-border-mid" />
              </div>

              <div className="grid sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-xl border border-border-dim bg-bg-tertiary" />
                ))}
              </div>

              <div className="space-y-3">
                <div className="h-3 w-40 rounded-full bg-border-mid" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-xl border border-border-dim bg-bg-tertiary" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border-dim bg-bg-secondary p-5 space-y-4 animate-pulse">
                <div className="h-3 w-24 rounded-full bg-border-mid" />
                <div className="h-24 rounded-xl bg-bg-tertiary border border-border-dim" />
              </div>
              <div className="rounded-2xl border border-border-dim bg-bg-secondary p-5 space-y-4 animate-pulse">
                <div className="h-3 w-28 rounded-full bg-border-mid" />
                <div className="h-16 rounded-xl bg-bg-tertiary border border-border-dim" />
              </div>
              <div className="rounded-2xl border border-border-dim bg-bg-secondary p-5 space-y-4 animate-pulse">
                <div className="h-3 w-20 rounded-full bg-border-mid" />
                <div className="h-10 rounded-lg bg-bg-tertiary border border-border-dim" />
                <div className="h-10 rounded-lg bg-bg-tertiary border border-border-dim" />
                <div className="h-10 rounded-lg bg-bg-tertiary border border-border-dim" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
