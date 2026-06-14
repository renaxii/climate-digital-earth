"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Globe, Waves, Flame, CloudSun, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { LandingGlobe } from "@/components/landing/landing-globe";

const highlights = [
  { icon: Globe, title: "Climate trends", text: "Warmth, emissions, and sea-level change presented as a cinematic story instead of a dashboard." },
  { icon: Waves, title: "Sea ice changes", text: "Use the timeline to see how the polar system changes over decades." },
  { icon: Flame, title: "Wildfire activity", text: "Explore heat, drought, and burn risk through guided visualization layers." },
  { icon: CloudSun, title: "Scenario projections", text: "Compare scenario paths and understand that projection panels are explicitly labeled." }
];

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="safe-viewport overflow-hidden">
      <section className="relative flex min-h-screen flex-col justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-hero-radial" />
        <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />

        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/65">Climate Digital Earth</p>
            <p className="text-sm text-white/74">A museum-style climate exploration experience</p>
          </div>
          <Button href="/explorer" variant="secondary" className="bg-white text-slate-950 hover:bg-cyan-50">
            Enter Explorer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-cyan-200/15 bg-cyan-200/8 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-50/78">
                Earth from space · Climate science exhibit · Guided stories
              </p>
              <h1 className="max-w-4xl font-display text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Explore climate change through a living, interactive Earth.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Move through historical datasets, climate layers, story-driven narratives, and scenario projections in a calm, premium interface designed for learning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button href="/explorer">Enter Explorer</Button>
              <a href="#highlights" className="focus-ring inline-flex items-center justify-center rounded-full bg-white/8 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/14 transition hover:bg-white/14">
                See highlights
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[["56", "Years of climate data"], ["5", "Interactive climate layers"], ["3", "Guided climate stories"]].map(([value, label]) => (
                <Card key={label} className="bg-white/6 p-4">
                  <div className="text-3xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-sm text-white/64">{label}</div>
                </Card>
              ))}
            </div>
          </motion.div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-8 rounded-full border border-cyan-100/12 blur-[1px]" />
            <LandingGlobe />
          </div>
        </div>

        <section id="highlights" className="grid gap-4 py-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item, index) => (
            <motion.article
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.7 }}
            >
              <Card className="h-full">
                <div className="mb-4 inline-flex rounded-2xl bg-cyan-200/10 p-3 text-cyan-100">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/68">{item.text}</p>
              </Card>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-5 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionHeading
              eyebrow="About"
              title="Built for clarity, not clutter"
              description="The experience is organized like a museum exhibit: approachable entry points, concise explanations, and supporting data panels that never bury the main story."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Data sources</p>
                <p className="mt-2 text-sm leading-6 text-white/66">NASA and NOAA-inspired climate trends, preprocessed into static JSON for responsive browsing and predictable loading.</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Scientific method</p>
                <p className="mt-2 text-sm leading-6 text-white/66">Each layer pairs visual evidence with short interpretation panels to keep the science accessible.</p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/64">What’s inside</p>
              <h2 className="mt-3 font-display text-2xl text-white">Globe, timeline, stories, charts, regions, and scenario paths.</h2>
            </div>
            <Button href="/explorer" className="justify-between rounded-2xl px-4 py-3">
              Open the interactive exhibit
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Card>
        </section>
      </section>
    </main>
  );
}
