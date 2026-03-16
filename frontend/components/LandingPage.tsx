"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  Check,
  FileCheck,
  Play,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useInView } from "@/lib/hooks/useInView";

type Feature = {
  number: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    number: "01",
    title: "Prior Auth on Autopilot",
    description:
      "AI agents navigate payer portals, fill forms, and submit authorization requests in under 4 minutes. What used to take 45 minutes.",
    icon: FileCheck,
  },
  {
    number: "02",
    title: "Instant Eligibility Checks",
    description:
      "Verify patient coverage, deductibles, and copays before they walk in. No more billing surprises for you or your patients.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Automated Claim Tracking",
    description:
      "Agents monitor every submitted claim across every payer portal. Get alerts the moment something needs attention.",
    icon: Activity,
  },
  {
    number: "04",
    title: "Smart Denial Appeals",
    description:
      "When claims are denied, ClearClaim reads the reason, prepares the appeal, and resubmits — automatically.",
    icon: RefreshCw,
  },
];

export default function LandingPage() {
  const [openDemo, setOpenDemo] = useState(false);
  const initials = useMemo(() => ["DM", "RT", "KL", "AB", "SN"], []);

  return (
    <div className="bg-black text-white selection:bg-teal/20 selection:text-white">
      <svg width="0" height="0" className="absolute">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
        </filter>
      </svg>

      <Navbar />

      <main>
        <section className="landing-hero relative min-h-screen overflow-hidden px-6 pb-20 pt-28 md:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(0,212,200,0.15),transparent_45%)]" />
          <div className="pointer-events-none absolute right-[-120px] top-[45%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(77,158,255,0.1),transparent_70%)]" />
          <div className="pointer-events-none absolute left-[-60px] top-[40%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(0,212,200,0.08),transparent_70%)]" />
          <div className="hero-grid pointer-events-none absolute inset-0" />
          <div className="hero-grain pointer-events-none absolute inset-0" />

          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-16 xl:grid-cols-2">
            <div className="max-w-xl">
              <div className="fade-up-1 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cgreen" />
                AI-Powered
              </div>

              <h1 className="fade-up-2 mt-6 font-display text-5xl font-extrabold leading-[0.95] text-text-primary md:text-7xl">
                Insurance Admin
                <br />
                <span className="text-teal [text-shadow:0_0_28px_rgba(0,212,200,0.45)]">On Autopilot.</span>
              </h1>

              <p className="fade-up-3 mt-6 max-w-[520px] font-body text-lg leading-relaxed text-[#9BA5B8]">
                ClearClaim&apos;s AI agents navigate real insurance portals, submit prior authorizations,
                verify eligibility, and chase claims — while your team focuses on patients.
              </p>

              <div className="fade-up-3 mt-8 grid max-w-[560px] grid-cols-3 gap-4 border-y border-border/80 py-5">
                {[
                  ["35B+", "Annual admin waste"],
                  ["13 hrs", "Per physician/week"],
                  ["92%", "Approval rate"],
                ].map(([value, label]) => (
                  <div key={value} className="pr-3 first:border-r first:border-border/80 last:border-l last:border-border/80">
                    <p className="font-display text-3xl text-teal md:text-4xl">{value}</p>
                    <p className="mt-1 font-body text-xs text-[#738099]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="fade-up-4 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="rounded-lg bg-teal px-6 py-3 font-display text-lg font-semibold text-black transition hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(0,212,200,0.35)]"
                >
                  Start Automating Free →
                </Link>
                <button
                  onClick={() => setOpenDemo(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-teal/40 px-6 py-3 font-body text-white transition hover:bg-teal/10"
                >
                  <Play className="h-4 w-4 fill-teal text-teal" />
                  Watch Demo
                </button>
              </div>

              <div className="fade-up-4 mt-6">
                <p className="font-body text-sm text-[#8D99AD]">Trusted by 200+ medical practices</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {initials.map((name, i) => (
                      <div
                        key={name}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-black text-[10px] font-semibold"
                        style={{ background: ["#003b39", "#23304A", "#4A2632", "#244A3A", "#4A3F24"][i] }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                  <p className="ml-2 font-mono text-xs text-[#9BA5B8]">★★★★★ 4.9/5 from early access users</p>
                </div>
              </div>
            </div>

            <div className="relative hidden xl:block">
              <div className="ring-spin-large pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/10" />
              <div className="ring-spin-small pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/20" />
              <HeroMockup />
            </div>
          </div>
        </section>

        <section className="border-y border-border/80 bg-[#091122] py-4">
          <div className="mx-auto flex max-w-[1240px] items-center gap-5 overflow-hidden px-6 md:px-10">
            <p className="shrink-0 font-body text-sm text-[#7F8BA0]">Automating workflows for practices using:</p>
            <div className="marquee flex min-w-0 items-center gap-4 whitespace-nowrap font-mono text-sm text-[#6F7D95]">
              {[
                "UnitedHealthcare",
                "Blue Cross Blue Shield",
                "Aetna",
                "Cigna",
                "Humana",
                "Medicaid",
                "Availity",
                "WellCare",
                "Molina",
              ]
                .concat([
                  "UnitedHealthcare",
                  "Blue Cross Blue Shield",
                  "Aetna",
                  "Cigna",
                  "Humana",
                  "Medicaid",
                  "Availity",
                  "WellCare",
                  "Molina",
                ])
                .map((name, index) => (
                  <span key={`${name}-${index}`} className="inline-flex items-center gap-4">
                    <span className="text-teal">•</span>
                    {name}
                  </span>
                ))}
            </div>
          </div>
        </section>

        <SectionTitle id="features" title="How ClearClaim Works" subtitle="Four workflows. Zero manual work." />

        <section className="mx-auto grid w-full max-w-[1240px] gap-6 px-6 pb-20 md:grid-cols-2 md:px-10">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.number} delay={index * 100}>
              <FeatureCard {...feature} />
            </AnimatedCard>
          ))}
        </section>

        <section id="how" className="border-y border-teal/20 bg-[#0c1326] py-20">
          <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10">
            <SectionTitle title="Watch It Work" subtitle="Real AI. Real portals. Real results." compact />
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-[#0a1020] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-border bg-[#0a0f1e] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cred" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cyellow" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cgreen" />
                </div>
                <div className="rounded-md border border-border bg-black/40 px-4 py-1 font-mono text-xs text-[#7F8BA0]">
                  app.clearclaim.ai/tasks/live
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-xl">Tasks Queue</h4>
                    <button className="rounded-md border border-teal/40 bg-teal/10 px-3 py-1 font-mono text-xs text-teal">Watch Live</button>
                  </div>
                  <div className="space-y-2">
                    {["Prior Auth - MRI Knee", "Eligibility - Aetna", "Claim Status - BCBS", "Appeal - Humana"].map((row, i) => (
                      <div key={row} className="flex items-center justify-between rounded-md border border-border bg-[#0a1020] px-3 py-2">
                        <span className="font-body text-sm text-[#9BA5B8]">{row}</span>
                        <span className={`h-2 w-2 rounded-full ${i === 2 ? "bg-cyellow" : i === 3 ? "bg-cred" : "bg-cgreen"}`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-black/40 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Live Browser Stream</p>
                  <div className="mt-3 h-[190px] rounded-lg border border-border bg-[radial-gradient(circle_at_20%_20%,rgba(0,212,200,0.18),transparent_40%),linear-gradient(145deg,#1b253d,#0a1020)] blur-[0.2px]" />
                  <p className="mt-3 text-xs text-[#7F8BA0]">Agent navigating payer portal and extracting structured result data.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm font-mono text-[#8D99AD]">
              <span className="inline-flex items-center gap-2"><span className="text-teal">●</span> Live browser stream</span>
              <span className="inline-flex items-center gap-2"><span className="text-teal">●</span> Real payer portals</span>
              <span className="inline-flex items-center gap-2"><span className="text-teal">●</span> Structured results</span>
            </div>

            <div className="mt-8 text-center">
              <Link href="/register" className="font-display text-lg text-teal hover:underline">Try It Yourself →</Link>
            </div>
          </div>
        </section>

        <section id="impact" className="py-20">
          <div className="mx-auto w-full max-w-[1100px] px-6 md:px-10">
            <SectionTitle title="The Math Is Simple" subtitle="" compact />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <StatCard accent="teal" label="Average annual savings per practice" subtext="vs. dedicated billing staff" suffix="" value={45000} prefix="$" />
              <StatCard accent="default" label="Returned to your team weekly" subtext="per physician on average" suffix=" hrs" value={13} />
              <StatCard accent="green" label="Authorization approval rate" subtext="across all supported payers" suffix="%" value={92} />
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-border bg-[#0c1326] py-20">
          <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10">
            <SectionTitle title="Simple, Transparent Pricing" subtitle="Start free. Scale as you grow." compact />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <PricingCard tier="Starter" price="$299/mo" subtitle="Solo practice or small clinic" features={["Up to 100 prior auth submissions/month", "2 payer portals", "Eligibility verification", "Email notifications", "Email support"]} cta="Get Started" href="/register" />
              <PricingCard tier="Growth" price="$799/mo" subtitle="Multi-provider practice" features={["Up to 500 submissions/month", "Unlimited payer portals", "All task types included", "Live agent stream view", "API access", "Priority support + onboarding"]} cta="Start Free Trial" href="/register" featured />
              <PricingCard tier="Scale" price="$1,999/mo" subtitle="Specialty clinic or billing company" features={["Unlimited submissions", "White-label option", "Dedicated success manager", "SLA guarantee", "Custom payer integrations", "HIPAA BAA included"]} cta="Contact Sales" href="mailto:sales@clearclaim.ai" />
            </div>
            <p className="mt-8 text-center font-body text-sm text-[#8D99AD]">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </section>

        <section className="relative overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,212,200,0.18),transparent_45%)]" />
          <div className="relative mx-auto max-w-[900px] px-6 text-center md:px-10">
            <h2 className="font-display text-4xl font-bold md:text-6xl">Ready to Reclaim Your Time?</h2>
            <p className="mx-auto mt-4 max-w-[680px] font-body text-lg text-[#96A2B5]">Join 200+ practices automating their insurance workflows with ClearClaim.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="rounded-lg bg-teal px-7 py-3 font-display text-lg text-black transition hover:shadow-[0_0_30px_rgba(0,212,200,0.35)]">Get Started Free →</Link>
              <Link href="/login?demo=1" className="rounded-lg border border-teal/40 px-7 py-3 font-body text-white transition hover:bg-teal/10">Try Demo Account</Link>
            </div>
            <p className="mt-4 text-sm text-[#8D99AD]">Setup takes under 5 minutes. No credit card required.</p>
          </div>
        </section>
      </main>

      <footer id="about" className="border-t border-border bg-[#080d1a] px-6 py-14 md:px-10">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />
              <h3 className="font-display text-2xl">Clear<span className="text-teal">Claim</span></h3>
            </div>
            <p className="mt-3 font-body text-sm text-[#8D99AD]">Autonomous Insurance Navigation</p>
            <div className="mt-4 flex gap-3 text-xs text-[#7D899E]">
              <span className="rounded border border-border px-2 py-1">X</span>
              <span className="rounded border border-border px-2 py-1">in</span>
              <span className="rounded border border-border px-2 py-1">Discord</span>
            </div>
          </div>
          <FooterCol title="Product" links={["Features", "Pricing", "Security", "Integrations", "API"]} />
          <FooterCol title="Company" links={["About", "Blog", "Careers", "Press", "Contact"]} />
          <FooterCol title="Legal" links={["Privacy Policy", "Terms of Service", "HIPAA Compliance", "Cookies"]} />
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-[#6F7D95]">
          <p>© 2025 ClearClaim. All rights reserved.</p>
          <p>Built with TinyFish Web Agent API</p>
        </div>
      </footer>

      {openDemo && <DemoModal onClose={() => setOpenDemo(false)} />}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed left-0 top-0 z-50 w-full border-b border-border/70 backdrop-blur-xl transition-colors ${scrolled ? "bg-[#050810]/85" : "bg-[#050810]/60"}`}>
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal" />
          <span className="font-display text-2xl text-white">Clear<span className="text-teal">Claim</span></span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[#9AA5B8] md:flex">
          {[["Features", "features"], ["How It Works", "how"], ["Pricing", "pricing"], ["About", "about"]].map(([label, target]) => (
            <a key={label} href={`#${target}`} className="group relative py-1 hover:text-white">
              {label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-teal transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg border border-border px-4 py-2 font-body text-sm text-white transition hover:border-teal/40 hover:bg-teal/5">Sign In</Link>
          <Link href="/register" className="rounded-lg bg-teal px-4 py-2 font-body text-sm font-semibold text-black transition hover:shadow-[0_0_24px_rgba(0,212,200,0.3)]">Get Started Free</Link>
        </div>
      </div>
    </header>
  );
}

function HeroMockup() {
  return (
    <div className="hero-mockup mx-auto w-[560px] rounded-xl border border-teal/20 bg-[#0b1224] shadow-[0_40px_80px_rgba(0,212,200,0.15),0_0_0_1px_rgba(0,212,200,0.1)]">
      <div className="flex items-center justify-between border-b border-border bg-[#0a0f1e] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cred" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyellow" />
          <span className="h-2.5 w-2.5 rounded-full bg-cgreen" />
        </div>
        <div className="rounded-md border border-border bg-black/35 px-3 py-1 font-mono text-[10px] text-[#789]">app.clearclaim.ai/dashboard</div>
      </div>
      <div className="grid grid-cols-[74px_1fr]">
        <aside className="border-r border-border bg-[#0a1020] p-3">
          <div className="mb-4 h-2 w-12 rounded bg-teal/70" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-full bg-[#24314b]" />
            ))}
          </div>
        </aside>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {["248|Tasks", "91%|Success", "13h|Saved", "6|Alerts"].map((entry) => {
              const [num, label] = entry.split("|");
              return (
                <div key={entry} className="rounded-lg border border-border bg-[#0f1629] p-2">
                  <p className="font-display text-lg text-teal">{num}</p>
                  <p className="font-mono text-[10px] text-[#74819b]">{label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-[1.4fr_0.9fr] gap-3">
            <div className="rounded-lg border border-border bg-[#0f1629] p-2">
              {["PA - MRI|green", "Claim Follow-up|yellow", "Eligibility|green", "Appeal|red"].map((entry) => {
                const [task, state] = entry.split("|");
                return (
                  <div key={entry} className="mb-1 flex items-center justify-between rounded border border-border/80 bg-[#0a0f1e] px-2 py-1 text-[10px] text-[#8e9ab0]">
                    <span>{task}</span>
                    <span className={`h-2 w-2 rounded-full ${state === "green" ? "bg-cgreen" : state === "yellow" ? "bg-cyellow" : "bg-cred"}`} />
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-border bg-[#0f1629] p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#8e9ab0]">Live Activity</span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-cgreen" />
              </div>
              <div className="space-y-1 text-[10px] text-[#738099]">
                <p>Portal opened</p>
                <p>Form validated</p>
                <p>Submission complete</p>
                <p>Awaiting payer response</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ number, title, description, icon: Icon }: Feature) {
  return (
    <article className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,212,200,0.12)]">
      <span className="absolute left-0 top-0 h-[3px] w-0 bg-teal transition-all duration-300 group-hover:w-full" />
      <span className="absolute right-4 top-4 font-mono text-xs text-[#43506a]">{number}</span>
      <Icon className="h-12 w-12 text-teal" />
      <h3 className="mt-4 font-display text-2xl text-white">{title}</h3>
      <p className="mt-3 font-body text-[#92A0B6]">{description}</p>
    </article>
  );
}

function SectionTitle({ title, subtitle, id, compact }: { title: string; subtitle: string; id?: string; compact?: boolean; }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div id={id} ref={ref} className={`mx-auto w-full max-w-[1240px] px-6 ${compact ? "pb-0 pt-0" : "pb-12 pt-20"} md:px-10`}>
      <div className={inView ? "animate-visible" : "animate-hidden"}>
        <h2 className="font-display text-4xl text-white md:text-5xl">{title}</h2>
        {subtitle && <p className="mt-3 font-body text-lg text-[#8D99AD]">{subtitle}</p>}
      </div>
    </div>
  );
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={inView ? "animate-visible" : "animate-hidden"}>{children}</div>;
}

function StatCard({ value, label, subtext, prefix = "", suffix = "", accent }: { value: number; label: string; subtext: string; prefix?: string; suffix?: string; accent: "teal" | "green" | "default"; }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const shown = useCountUp(inView ? value : 0, 1100);
  const cls = accent === "teal" ? "border-teal/45 bg-teal/10" : accent === "green" ? "border-cgreen/45 bg-cgreen/10" : "border-border bg-card";
  return (
    <div ref={ref} className={`rounded-xl border p-6 ${cls}`}>
      <p className="font-display text-4xl text-white md:text-5xl">{prefix}{shown.toLocaleString()}{suffix}</p>
      <p className="mt-3 font-body text-base text-[#D3DBEA]">{label}</p>
      <p className="mt-1 font-body text-sm text-[#8D99AD]">{subtext}</p>
    </div>
  );
}

function PricingCard({ tier, price, subtitle, features, cta, href, featured }: { tier: string; price: string; subtitle: string; features: string[]; cta: string; href: string; featured?: boolean; }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <article ref={ref} className={`${inView ? "animate-visible" : "animate-hidden"} relative rounded-2xl border p-6 ${featured ? "scale-[1.02] border-teal/40 bg-[#0e1830] shadow-[0_0_50px_rgba(0,212,200,0.15)]" : "border-border bg-card"}`}>
      {featured && <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 font-mono text-xs uppercase text-black">Most Popular</span>}
      <p className="font-display text-3xl text-white">{tier}</p>
      <p className="mt-2 font-display text-4xl text-teal">{price}</p>
      <p className="mt-2 font-body text-sm text-[#8D99AD]">{subtitle}</p>
      <ul className="mt-5 space-y-2">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-2 font-body text-sm text-[#c8d1e2]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{item}</li>
        ))}
      </ul>
      <Link href={href} className={`mt-6 inline-block w-full rounded-lg px-4 py-2.5 text-center font-body text-sm font-semibold transition ${featured ? "bg-teal text-black hover:shadow-[0_0_28px_rgba(0,212,200,0.35)]" : "border border-border text-white hover:border-teal/40 hover:bg-teal/5"}`}>{cta}</Link>
    </article>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-display text-xl text-white">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((item) => (
          <li key={item}><a href="#" className="font-body text-sm text-[#8D99AD] transition hover:text-teal">{item}</a></li>
        ))}
      </ul>
    </div>
  );
}

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#0d1326] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl">Demo Preview</h3>
          <button onClick={onClose} className="rounded-md border border-border p-2 text-[#9AA5B8] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,200,0.12),transparent_55%)]">
          <p className="font-body text-[#95A2B6]">Demo video placeholder. Hook this to your Loom/Youtube/Vimeo URL.</p>
        </div>
      </div>
    </div>
  );
}
