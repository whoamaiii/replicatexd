import type { ReactNode } from 'react'

export function AppShell(props: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_12%_10%,rgba(46,247,208,0.14),transparent_55%),radial-gradient(800px_circle_at_80%_20%,rgba(255,43,214,0.12),transparent_52%),radial-gradient(900px_circle_at_55%_90%,rgba(255,176,32,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_40%,rgba(0,0,0,0.35))]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1400px] gap-6 px-6 py-6">
        <aside className="w-[420px] shrink-0">{props.left}</aside>
        <main className="min-w-0 flex-1">{props.right}</main>
      </div>
    </div>
  )
}


