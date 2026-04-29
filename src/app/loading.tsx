export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary px-6">
      <div className="max-w-md w-full rounded-2xl border border-border-mid bg-bg-secondary/90 p-8 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-green to-accent-blue animate-pulse" />
          <div>
            <div className="h-3 w-24 rounded-full bg-border-mid animate-pulse" />
            <div className="mt-2 h-4 w-40 rounded-full bg-border-mid/80 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-3 w-3/4 rounded-full bg-border-mid animate-pulse" />
          <div className="h-3 w-full rounded-full bg-border-mid/80 animate-pulse" />
          <div className="h-3 w-5/6 rounded-full bg-border-mid/70 animate-pulse" />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="h-8 w-24 rounded-lg bg-border-mid animate-pulse" />
          <div className="h-8 w-32 rounded-lg bg-accent-green/30 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
