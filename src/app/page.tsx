import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    title: 'Capture',
    description:
      'Toss a competitor link or a stray observation into Fleet. It scrapes, enriches, and indexes into your project context — without breaking your flow.',
  },
  {
    number: '02',
    title: 'Connect',
    description:
      'Import your LinkedIn and Twitter network. Fleet maps your connections to your GTM — warm intros, co-marketing partners, customers hiding in your existing graph.',
  },
  {
    number: '03',
    title: 'Strategize',
    description:
      'Chat with your GTM agent. It knows your research, your network, your goals — and ships real deliverables: positioning, competitive analysis, launch plans.',
  },
]

export default function FleetLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[-25%] h-[600px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(124,98,234,0.10)_0%,transparent_60%)]"
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-border/60">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-baseline gap-2 text-base font-semibold tracking-tight text-foreground"
          >
            <span>Fleet</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              GTM
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <a
                href="https://github.com/BiscayneDev/fleet"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-3.5"
                  aria-hidden="true"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/home">
                Launch Fleet
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
          <Sparkles className="size-3" />
          GTM intelligence for founders
        </div>

        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
          Your go-to-market
          <br />
          <span className="bg-gradient-to-br from-primary to-[color:oklch(0.72_0.16_295)] bg-clip-text text-transparent">
            gets smarter every day.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Capture research, connect your network, and let an LLM build your
          launch strategy. Fleet turns scattered links and connections into a
          competitive GTM playbook — local-first, markdown-native, yours.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          <Button asChild size="lg">
            <Link href="/home">
              Open Fleet
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
      </section>

      {/* Code preview — Linear-tier "show what content looks like" */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-1.5 border-b border-border bg-card/80 px-3 py-2">
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="size-2.5 rounded-full bg-muted" />
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
              inbox/2026-05-16.md
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
            <code className="text-muted-foreground">
              <span className="text-foreground">## 09:16 — link</span>
              {'\n'}
              URL:{' '}
              <span className="text-primary">
                https://x.com/mattepstein/status/...
              </span>
              {'\n'}
              Title: The Viral Launch Formula
              {'\n\n'}
              <span className="text-muted-foreground/70">
                ### Summary
              </span>
              {'\n'}
              21-agent Claude pipeline for &ldquo;Bold Claim&rdquo; positioning.
              Hi-intensity research, aggressive editing.
              {'\n\n'}
              <span className="text-muted-foreground/50">
                {'<!--- hanz:takes:begin --->'}
              </span>
              {'\n'}
              <span className="text-[color:oklch(0.78_0.16_80)]">
                High-signal framework for Shipyard launch. Aligns with the
                &ldquo;Claude as an OS&rdquo; meta-narrative.
              </span>
              {'\n'}
              <span className="text-muted-foreground/50">
                {'<!--- hanz:takes:end --->'}
              </span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Every capture lands as a markdown block. Your brain stays portable.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-6 pb-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group rounded-xl border border-border bg-card/40 p-6 transition-all hover:border-primary/40 hover:bg-card/70"
            >
              <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-primary">
                {step.number} / {steps.length.toString().padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Value prop */}
      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            Not another AI chatbot.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            ChatGPT gives generic advice because it doesn&rsquo;t know your
            project. Fleet has your research, your network, your competitive
            landscape — and gets smarter with every link you capture. The
            output is grounded in{' '}
            <em className="font-medium not-italic text-primary">
              your
            </em>{' '}
            context, not the internet&rsquo;s.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 border-t border-border/60 px-6 py-20 text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          Ready to launch?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your GTM strategy starts with one link.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/home">
              Get started — free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 px-6 py-6 text-center text-xs text-muted-foreground">
        Built by{' '}
        <a
          href="https://openshipyard.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Shipyard
        </a>{' '}
        · Open source · Local-first
      </footer>
    </div>
  )
}
