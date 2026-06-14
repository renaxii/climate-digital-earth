"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play, Pause, Contrast } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { climateLayers, latestObservedYear, regions, scenarios, stories } from "@/data/climateData";
import { useClimateStore } from "@/stores/useClimateStore";
import { TimelineSlider } from "@/components/timeline/timeline-slider";
import { StoryModePanel } from "@/components/story/story-mode-panel";
import { RegionExplorer } from "@/components/regions/region-explorer";
import { EducationalInsights } from "@/components/insights/educational-insights";

const ClimateCharts = dynamic(() => import("@/components/charts/climate-charts").then((module) => module.ClimateCharts), {
  ssr: false,
  loading: () => <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-sm text-white/60">Loading charts</div>
});

const ClimateGlobe = dynamic(() => import("@/components/globe/climate-globe").then((module) => module.ClimateGlobe), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[520px] items-center justify-center rounded-[36px] border border-white/10 bg-white/5 text-white/60">Loading interactive Earth</div>
});

export function ExplorerPage() {
  const reduceMotion = useReducedMotion();
  const {
    selectedLayer,
    selectedYear,
    isPlaying,
    activeStoryId,
    selectedRegionId,
    focusedCountry,
    selectedScenario,
    highContrast,
    setSelectedLayer,
    setSelectedYear,
    setIsPlaying,
    advanceYear,
    goToYear,
    setSelectedRegionId,
    setFocusedCountry,
    setSelectedScenario,
    toggleHighContrast,
    startStory,
    stopStory
  } = useClimateStore();

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(advanceYear, 1400);
    return () => window.clearInterval(timer);
  }, [advanceYear, isPlaying]);

  const activeRegion = useMemo(() => regions.find((region) => region.id === selectedRegionId) ?? regions[regions.length - 1], [selectedRegionId]);
  const activeLayer = useMemo(() => climateLayers.find((layer) => layer.key === selectedLayer) ?? climateLayers[0], [selectedLayer]);
  const activeStory = useMemo(() => stories.find((story) => story.id === activeStoryId) ?? null, [activeStoryId]);

  return (
    <main className={highContrast ? "safe-viewport bg-slate-950 text-white" : "safe-viewport bg-[radial-gradient(circle_at_top,_rgba(13,45,80,0.55),_transparent_28%),linear-gradient(180deg,#02101d_0%,#061827_48%,#04111e_100%)] text-white"}>
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-5 px-4 py-4 lg:px-5 lg:py-5">
        <header className="glass-panel-strong flex flex-wrap items-center justify-between gap-4 rounded-[30px] px-5 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/18">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/60">Explorer</p>
              <h1 className="font-display text-2xl sm:text-3xl">Climate Digital Earth</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={toggleHighContrast}>
              <Contrast className="mr-2 h-4 w-4" /> High contrast
            </Button>
            <Button variant="secondary" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isPlaying ? "Pause" : "Play timeline"}
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)_380px]">
          <aside className="space-y-5">
            <Card className="space-y-5">
              <SectionHeading eyebrow="Layers" title="Climate overlays" description="Enable a layer to shift the globe, legend, and charts around a specific climate signal." />
              <div className="space-y-2">
                {climateLayers.map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setSelectedLayer(layer.key)}
                    className={`focus-ring w-full rounded-2xl border px-4 py-3 text-left transition ${selectedLayer === layer.key ? "border-cyan-200/25 bg-cyan-200/14" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{layer.shortLabel}</span>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: layer.accent }} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/64">{layer.label}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionHeading eyebrow="Stories" title="Guided narratives" description="Each story moves the camera, selects a year, and explains the moment step by step." />
              <div className="space-y-2">
                {stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => (activeStoryId === story.id ? stopStory() : startStory(story.id))}
                    className={`focus-ring w-full rounded-2xl border px-4 py-3 text-left transition ${activeStoryId === story.id ? "border-white/20 bg-white/12" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: story.color }} />
                      <span className="font-semibold">{story.title}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/64">{story.subtitle}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionHeading eyebrow="Search" title="Region explorer" description="Search or choose a region to inspect trend summaries and key observations." />
              <RegionExplorer selectedRegionId={selectedRegionId} onSelectRegion={setSelectedRegionId} onSelectCountry={setFocusedCountry} onClearStory={stopStory} />
            </Card>
          </aside>

          <section className="space-y-5">
            <Card className="relative overflow-hidden p-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(126,222,255,0.12),transparent_34%)]" />
              <div className="relative grid min-h-[620px] place-items-center lg:min-h-[760px]">
                <ClimateGlobe />
              </div>
            </Card>

            <TimelineSlider year={selectedYear} onChange={setSelectedYear} onJump={goToYear} onTogglePlay={() => setIsPlaying(!isPlaying)} isPlaying={isPlaying} />
          </section>

          <aside className="space-y-5">
            <Card className="space-y-4">
              <SectionHeading eyebrow="Metrics" title="What changed this year" description="A compact readout of the active layer and region based on the current timeline position." />
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Year" value={selectedYear.toString()} />
                <Metric label="Location" value={focusedCountry ? focusedCountry.name : activeRegion.name} />
                <Metric label="Layer" value={activeLayer.shortLabel} />
                <Metric label="Data" value={selectedYear <= latestObservedYear ? "Observed" : "Projected"} />
              </div>
              <div className="rounded-3xl bg-white/5 p-4 text-sm leading-6 text-white/72">{activeLayer.explanation}</div>
            </Card>

            <Card className="space-y-4">
              <SectionHeading eyebrow="Scenarios" title="Scenario simulator" description="These projections are clearly labeled and are meant to compare potential paths, not predictions." />
              <div className="grid grid-cols-2 gap-2">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.key}
                    onClick={() => setSelectedScenario(scenario.key)}
                    className={`focus-ring rounded-2xl border px-4 py-3 text-left transition ${selectedScenario === scenario.key ? "border-cyan-200/25 bg-cyan-200/14" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
                  >
                    <div className="font-semibold">{scenario.label}</div>
                    <p className="mt-1 text-xs leading-5 text-white/64">{scenario.note}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <SectionHeading eyebrow="Insight" title="Educational context" description="Short explanations help the exhibit stay welcoming and accessible." />
              <EducationalInsights selectedLayer={selectedLayer} selectedRegion={selectedRegionId} selectedScenario={selectedScenario} />
            </Card>
          </aside>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <ClimateCharts selectedLayer={selectedLayer} selectedYear={selectedYear} selectedRegionId={selectedRegionId} />
          <Card className="space-y-4">
            <SectionHeading eyebrow="Story mode" title="Step through the current narrative" description="When a story is active, the globe and metrics follow the selected slide." />
            <AnimatePresence mode="wait">
              {activeStory ? (
                <motion.div key={activeStory.id} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
                  <StoryModePanel storyId={activeStory.id} />
                </motion.div>
              ) : (
                <motion.div key="idle" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-3xl border border-dashed border-white/12 bg-white/5 p-5 text-sm text-white/66">
                  Select a story to guide the camera and timeline.
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/55">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
