"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, CircleDot, Layers, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { climateLayers, climateSeries, latestObservedYear, yearExtent } from "@/data/climateData";
import type { ClimateLayerKey, CountryFocusTarget } from "@/types/climate";

const ImmersiveEarth = dynamic(() => import("@/components/experience/immersive-earth").then((module) => module.ImmersiveEarth), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_46%,rgba(91,194,255,0.18),transparent_34%)]" />
})

type StorySlide = {
  id: string;
  label: string;
  layer: ClimateLayerKey;
  year: number;
  camera: {
    lat: number;
    lon: number;
    distance: number;
  };
};

const glossary = {
  "temperature anomaly": "How much warmer or cooler a year is compared with a long-term average.",
  "sea ice extent": "The ocean area with enough floating ice to count as ice-covered.",
  "carbon emissions": "Carbon dioxide released into the air, mostly from burning fossil fuels.",
  ppm: "Parts per million: a way to count tiny amounts of gas in the atmosphere.",
  "sea level rise": "The long-term increase in ocean height along coasts and globally.",
  albedo: "How much sunlight a surface reflects. Bright ice reflects more than dark ocean.",
  "climate scenario": "A possible future path based on choices, emissions, and warming.",
  projection: "A model-based estimate of what could happen under certain assumptions.",
  "warming threshold": "A temperature level where climate risks become more likely or severe."
} as const;

type GlossaryKey = keyof typeof glossary;

type LayerState = {
  id: ClimateLayerKey;
  label: string;
  title: string;
  description: ReactNode;
  year: number;
  stat: string;
  statLabel: ReactNode;
  legend: string;
  colorScale: Array<{ color: string; label: string }>;
  overlayConfig: {
    mode: ClimateLayerKey;
    value: number;
    intensity: number;
  };
  tooltipTerms: GlossaryKey[];
};

const slides: StorySlide[] = [
  {
    id: "overview",
    label: "Overview",
    layer: "temperature",
    year: latestObservedYear,
    camera: { lat: 12, lon: -34, distance: 3.25 }
  },
  {
    id: "warming",
    label: "Warming Planet",
    layer: "temperature",
    year: latestObservedYear,
    camera: { lat: 20, lon: -12, distance: 2.8 }
  },
  {
    id: "ice",
    label: "Shrinking Ice",
    layer: "seaIce",
    year: latestObservedYear,
    camera: { lat: 78, lon: -42, distance: 2.45 }
  },
  {
    id: "seas",
    label: "Rising Seas",
    layer: "seaLevel",
    year: latestObservedYear,
    camera: { lat: -16, lon: -165, distance: 2.65 }
  },
  {
    id: "future",
    label: "Future Scenarios",
    layer: "emissions",
    year: yearExtent.max,
    camera: { lat: -4, lon: 36, distance: 2.95 }
  }
];

const scenarioOptions = [
  { label: "+1.5", value: 1 },
  { label: "+2.0", value: 1.18 },
  { label: "+3.0", value: 1.42 },
  { label: "+4.0", value: 1.68 }
];

const panelClass = "exhibit-panel";
const nestedPanelClass = "exhibit-panel-nested";
const iconButtonClass = "focus-ring exhibit-control inline-flex h-10 w-10 items-center justify-center";
const pillButtonClass = "focus-ring exhibit-pill px-4 py-2 text-sm";

export function ImmersiveExperience() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeLayer, setActiveLayer] = useState<ClimateLayerKey>(slides[0].layer);
  const [focusedCountry, setFocusedCountry] = useState<CountryFocusTarget | null>(null);
  const [showSignal, setShowSignal] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isGlobeAutoEnabled, setIsGlobeAutoEnabled] = useState(true);
  const [isGlobeUserPaused, setIsGlobeUserPaused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [scenarioIntensity, setScenarioIntensity] = useState(scenarioOptions[1].value);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const activeLayerState = getLayerState(activeLayer, activeSlide.year);
  const progress = (activeIndex + 1) / slides.length;
  const camera = focusedCountry ? { lat: focusedCountry.lat, lon: focusedCountry.lon, distance: 2.35 } : activeSlide.camera;
  const visualMode: ClimateLayerKey | "overview" = activeLayerState.overlayConfig.mode;
  const overlayIntensity = activeSlide.id === "future" ? scenarioIntensity : activeLayerState.overlayConfig.intensity;
  const layerValue = activeLayerState.overlayConfig.value;
  const isGlobeAutoRotating = isGlobeAutoEnabled && !isGlobeUserPaused;
  const activeLayerAccent = activeLayerState.colorScale[0]?.color.includes("linear-gradient") ? "#ffffff" : activeLayerState.colorScale[0]?.color ?? "#ffffff";

  const goToSlide = useCallback((index: number, manual = true) => {
    const nextIndex = (index + slides.length) % slides.length;
    const nextSlide = slides[nextIndex] ?? slides[0];
    if (manual) {
      setIsAutoPlaying(false);
    }
    setActiveIndex(nextIndex);
    setActiveLayer(nextSlide.layer);
    setFocusedCountry(null);
    setShowSignal(false);
  }, []);

  const goNext = useCallback((manual = true) => goToSlide(activeIndex + 1, manual), [activeIndex, goToSlide]);
  const goPrevious = useCallback(() => goToSlide(activeIndex - 1, true), [activeIndex, goToSlide]);

  const pauseGlobeForInteraction = useCallback(() => {
    if (!isGlobeAutoEnabled) {
      return;
    }

    setIsGlobeUserPaused(true);
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
    }
    resumeTimer.current = window.setTimeout(() => {
      setIsGlobeUserPaused(false);
      resumeTimer.current = null;
    }, 1800);
  }, [isGlobeAutoEnabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goNext(true);
      }
      if (event.key === "ArrowLeft") {
        goPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious]);

  useEffect(() => {
    if (!isAutoPlaying) {
      return;
    }

    const timer = window.setInterval(() => goNext(false), 5200);
    return () => window.clearInterval(timer);
  }, [goNext, isAutoPlaying]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) {
        window.clearTimeout(resumeTimer.current);
      }
    };
  }, []);

  const handleTouchEnd = (x: number) => {
    if (touchStartX === null) {
      return;
    }

    const delta = x - touchStartX;
    if (Math.abs(delta) > 42) {
      if (delta < 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
    setTouchStartX(null);
  };

  return (
    <main
      className="relative h-[100vh] w-screen overflow-hidden bg-[#020814] text-white"
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_44%,rgba(75,178,255,0.2),transparent_34%),radial-gradient(circle_at_24%_18%,rgba(93,238,202,0.1),transparent_22%),linear-gradient(180deg,#020814_0%,#061525_52%,#020812_100%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.024)_1px,transparent_1px)] [background-size:112px_112px]" />

      <section className="absolute inset-0 z-0 md:left-[26vw]">
        <ImmersiveEarth
          layer={activeLayer}
          visualMode={visualMode}
          overlayIntensity={overlayIntensity}
          layerValue={layerValue}
          camera={camera}
          focusedCountry={focusedCountry}
          autoRotate={isGlobeAutoRotating}
          resetSignal={resetSignal}
          onFocusCountry={(country) => {
            setFocusedCountry(country);
            pauseGlobeForInteraction();
          }}
          onUserInteraction={pauseGlobeForInteraction}
        />
      </section>

      <header className="absolute left-4 right-4 top-4 z-20 flex items-center justify-end gap-3 sm:left-6 sm:right-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlaying((value) => !value)}
            className={iconButtonClass}
            aria-label={isAutoPlaying ? "Pause story autoplay" : "Play story autoplay"}
            aria-pressed={isAutoPlaying}
            title={isAutoPlaying ? "Pause story" : "Play story"}
          >
            {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="no-scrollbar exhibit-control flex max-w-[calc(100vw-5.5rem)] overflow-x-auto p-1">
            {climateLayers.map((layer) => (
              <button
                key={layer.key}
                aria-label={`Show ${layer.label} layer`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveLayer(layer.key);
                  setShowSignal(false);
                }}
                className={`focus-ring shrink-0 rounded-full px-3 py-2 text-xs transition ${activeLayer === layer.key ? "bg-white text-slate-950" : "text-white/78 hover:bg-white/12 hover:text-white"}`}
              >
                {layer.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="absolute right-4 top-[76px] z-20 flex flex-col gap-2 sm:right-6 sm:top-20">
        <button
          onClick={() => {
            setIsGlobeAutoEnabled((value) => !value);
            setIsGlobeUserPaused(false);
          }}
          className={iconButtonClass}
          aria-label={isGlobeAutoEnabled ? "Pause globe auto-rotation" : "Resume globe auto-rotation"}
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setFocusedCountry(null);
            setIsGlobeUserPaused(false);
            setResetSignal((value) => value + 1);
          }}
          className={iconButtonClass}
          aria-label="Reset globe view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <section className="absolute inset-x-4 bottom-[132px] z-10 grid items-end gap-4 sm:left-6 sm:right-6 lg:left-10 lg:right-10 lg:grid-cols-[430px_minmax(0,1fr)_260px]">
        <AnimatePresence mode="wait">
          <motion.article
            key={activeSlide.id}
            initial={reduceMotion ? false : { opacity: 0, x: -20, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 18, filter: "blur(8px)" }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            className={`${panelClass} themed-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden p-5 sm:p-6`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 break-words text-xs uppercase tracking-[0.26em] text-cyan-50/78">{activeSlide.label}</p>
              <p className="font-mono text-xs text-white/68">{activeSlide.year}</p>
            </div>

            <h1 className="mt-5 break-words font-display text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">{activeLayerState.title}</h1>
            <p className="mt-3 max-w-sm break-words text-[0.82rem] leading-5 text-white/78 sm:text-sm sm:leading-6">{activeLayerState.description}</p>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-5 border-t border-white/10 pt-5">
              <div className="min-w-0">
                <p className="break-words font-display text-4xl leading-none text-white sm:text-5xl">{activeLayerState.stat}</p>
                <p className="mt-2 break-words text-xs uppercase leading-5 tracking-[0.18em] text-white/68">{activeLayerState.statLabel}</p>
              </div>
              <div className={`${nestedPanelClass} px-3 py-2 text-right`}>
                <p className="text-xs text-white/68">Layer</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: activeLayerAccent }}>
                  {activeLayerState.label}
                </p>
              </div>
            </div>

            <CompactLegend layerState={activeLayerState} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSignal((value) => !value)}
                className={`inline-flex items-center gap-2 ${pillButtonClass}`}
              >
                <BarChart3 className="h-4 w-4" />
                {showSignal ? "Hide signal" : "Show signal"}
              </button>
              {focusedCountry ? (
                <button
                  onClick={() => setFocusedCountry(null)}
                  className={pillButtonClass}
                >
                  Clear focus
                </button>
              ) : null}
            </div>

            {activeSlide.id === "future" ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Warming scenario selector">
                {scenarioOptions.map((scenario) => (
                  <button
                    key={scenario.label}
                    onClick={() => setScenarioIntensity(scenario.value)}
                    className={`focus-ring whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${scenarioIntensity === scenario.value ? "border-cyan-100/50 bg-cyan-100/20 text-white" : "border-white/14 bg-white/[0.075] text-white/76 hover:bg-white/12 hover:text-white"}`}
                  >
                    {scenario.label} deg
                  </button>
                ))}
              </div>
            ) : null}

            <AnimatePresence initial={false}>
              {showSignal ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.32 }}
                  className="overflow-hidden"
                >
                  <MinimalChart chartKey={activeLayer} currentYear={activeLayerState.year} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.article>
        </AnimatePresence>
        <div className="hidden lg:block" />
        <LayerLegend layerState={activeLayerState} focusedCountry={focusedCountry?.name ?? null} />
      </section>

      <nav className={`absolute inset-x-4 bottom-4 z-20 p-3 sm:left-6 sm:right-6 lg:left-10 lg:right-10 ${panelClass}`}>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrevious}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.09] text-white/86 transition hover:bg-white/16 hover:text-white"
            aria-label="Previous section"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="h-px w-full max-w-[560px] bg-white/10">
              <motion.div className="h-px bg-cyan-100/80" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.45, ease: "easeOut" }} />
            </div>
            <div className="flex max-w-full items-center justify-center gap-2 overflow-hidden">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index, true)}
                  className={`focus-ring flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs transition sm:px-3 ${index === activeIndex ? "bg-white text-slate-950" : "text-white/74 hover:bg-white/12 hover:text-white"}`}
                  aria-label={`Go to ${slide.label}`}
                >
                  <CircleDot className="h-3 w-3 shrink-0" />
                  <span className="hidden sm:inline">{slide.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => goNext(true)}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition hover:bg-cyan-50"
            aria-label="Next section"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <div className="pointer-events-none absolute right-16 top-[78px] z-20 rounded-full border border-white/14 bg-[#071827]/72 px-4 py-2 font-mono text-xs text-white/76 backdrop-blur-2xl sm:right-20">
        {yearExtent.min} to {activeSlide.year}
      </div>
    </main>
  );
}

function LayerLegend({ layerState, focusedCountry }: { layerState: LayerState; focusedCountry: string | null }) {
  return (
    <aside className={`themed-scrollbar hidden max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden p-5 text-sm leading-6 text-white/76 lg:block ${panelClass}`}>
      <div className="mb-4 flex items-center gap-2 text-cyan-50/86">
        <Layers className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{layerState.label}</span>
      </div>
      <p className="break-words">{layerState.legend}</p>
      <div className="mt-4 space-y-3">
        {layerState.colorScale.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="h-2.5 w-8 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 break-words text-xs uppercase leading-5 tracking-[0.14em] text-white/72">{item.label}</span>
          </div>
        ))}
      </div>
      {focusedCountry ? <p className="mt-4 break-words text-cyan-50/88">Focused on {focusedCountry}</p> : null}
    </aside>
  );
}

function CompactLegend({ layerState }: { layerState: LayerState }) {
  return (
    <div className={`mt-4 p-3 ${nestedPanelClass}`}>
      <div className="space-y-2">
        {layerState.colorScale.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="h-2 w-7 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 break-words text-[0.66rem] uppercase leading-4 tracking-[0.12em] text-white/72">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlossaryTerm({ term }: { term: GlossaryKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const touchHandled = useRef(false);
  const id = useId();

  return (
    <span className="relative inline-flex align-baseline">
      <button
        type="button"
        aria-label={`${term}: ${glossary[term]}`}
        aria-describedby={isOpen ? id : undefined}
        aria-expanded={isOpen}
        onPointerDown={(event) => {
          if (event.pointerType === "touch" || event.pointerType === "pen") {
            event.preventDefault();
            touchHandled.current = true;
            setIsOpen((value) => !value);
          }
        }}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (touchHandled.current) {
            touchHandled.current = false;
            return;
          }
          setIsOpen((value) => !value);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="focus-ring cursor-help border-b border-dotted border-cyan-50/80 text-cyan-50 transition hover:text-white"
      >
        {term}
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 break-words rounded-[20px] border border-white/14 bg-[#071827]/95 px-3 py-2 text-left text-xs normal-case leading-5 tracking-normal text-white/88 shadow-2xl backdrop-blur-2xl"
          >
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/12 bg-[#081b2b]/90" />
            {glossary[term]}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

function MinimalChart({ chartKey, currentYear }: { chartKey: ClimateLayerKey; currentYear: number }) {
  const values = climateSeries.map((point) => Number(point[chartKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 320;
  const height = 76;
  const currentIndex = Math.max(0, climateSeries.findIndex((point) => point.year === currentYear));
  const points = climateSeries
    .map((point, index) => {
      const x = (index / (climateSeries.length - 1)) * width;
      const y = height - ((Number(point[chartKey]) - min) / Math.max(0.001, max - min)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const markerX = (currentIndex / (climateSeries.length - 1)) * width;

  return (
    <svg viewBox={`0 0 ${width} ${height + 14}`} className="mt-4 h-24 w-full overflow-visible">
      <line x1="0" x2={width} y1={height} y2={height} stroke="rgba(255,255,255,0.12)" />
      <polyline points={points} fill="none" stroke="rgba(177,239,255,0.92)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={markerX} x2={markerX} y1="0" y2={height} stroke="rgba(255,255,255,0.24)" strokeDasharray="3 5" />
    </svg>
  );
}

function getLayerState(layer: ClimateLayerKey, year: number): LayerState {
  const point = getPoint(year);

  const states: Record<ClimateLayerKey, LayerState> = {
    temperature: {
      id: "temperature",
      label: "Temperature",
      title: "The planet is warming.",
      description: (
        <>
          A small global average shift changes the baseline for heatwaves, seasons, ecosystems, and oceans. Scientists track this as a <GlossaryTerm term="temperature anomaly" />.
        </>
      ),
      year,
      stat: `${point.temperature.toFixed(2)} deg C`,
      statLabel: (
        <>
          NASA GISTEMP <GlossaryTerm term="temperature anomaly" />
        </>
      ),
      legend: "Blue marks cooler-than-baseline areas, white is near average, and yellow through red marks increasing warmth.",
      colorScale: [
        { color: "linear-gradient(90deg,#4bbcff,#f7fbff,#ffe58a,#ff6b3d)", label: "Cooler to warmer anomaly" }
      ],
      overlayConfig: { mode: "temperature", value: Number(point.temperature), intensity: 1 },
      tooltipTerms: ["temperature anomaly"]
    },
    seaIce: {
      id: "seaIce",
      label: "Sea Ice",
      title: "Sea ice is shrinking.",
      description: (
        <>
          Less bright ice exposes darker ocean, lowering <GlossaryTerm term="albedo" /> and amplifying change near the pole.
        </>
      ),
      year,
      stat: `${point.seaIce.toFixed(1)}M km2`,
      statLabel: (
        <>
          September Arctic <GlossaryTerm term="sea ice extent" />
        </>
      ),
      legend: "Pale cyan shows historical ice coverage, while bright white and cyan outlines emphasize current polar ice focus.",
      colorScale: [
        { color: "#d8fbff", label: "Historical ice coverage" },
        { color: "#ffffff", label: "Current ice focus" },
        { color: "#25d7ff", label: "Ice edge outline" }
      ],
      overlayConfig: { mode: "seaIce", value: Number(point.seaIce), intensity: 1 },
      tooltipTerms: ["sea ice extent", "albedo"]
    },
    wildfire: {
      id: "wildfire",
      label: "Wildfires",
      title: "Fire activity is intensifying.",
      description: "Hotter, drier extremes make some landscapes more likely to burn intensely when ignition and fuel conditions line up.",
      year,
      stat: `${point.wildfire}`,
      statLabel: "Indexed wildfire activity",
      legend: "Yellow, orange, and red markers show fire activity. Larger and brighter markers indicate stronger activity.",
      colorScale: [
        { color: "#ffd86b", label: "Low activity" },
        { color: "#ff8a34", label: "Moderate activity" },
        { color: "#ff3f2f", label: "High activity" }
      ],
      overlayConfig: { mode: "wildfire", value: Number(point.wildfire), intensity: 1 },
      tooltipTerms: []
    },
    seaLevel: {
      id: "seaLevel",
      label: "Sea Level",
      title: "The ocean keeps rising.",
      description: (
        <>
          Warming expands seawater and land ice melt adds volume, making <GlossaryTerm term="sea level rise" /> a long-lived coastal story.
        </>
      ),
      year,
      stat: `${point.seaLevel.toFixed(1)} mm`,
      statLabel: "Satellite-era sea-level signal",
      legend: "Cyan and blue coastal glow marks sea-level risk. Stronger glow indicates higher coastal exposure.",
      colorScale: [
        { color: "#9eeeff", label: "Lower coastal risk" },
        { color: "#4bc7ff", label: "Higher coastal risk" }
      ],
      overlayConfig: { mode: "seaLevel", value: Number(point.seaLevel), intensity: 1 },
      tooltipTerms: ["sea level rise"]
    },
    emissions: {
      id: "emissions",
      label: "CO2",
      title: "Carbon concentration keeps climbing.",
      description: (
        <>
          This view connects <GlossaryTerm term="carbon emissions" /> to atmospheric concentration, measured in <GlossaryTerm term="ppm" />, and possible future risk.
        </>
      ),
      year,
      stat: `${point.emissions.toFixed(0)} ppm`,
      statLabel: (
        <>
          Atmospheric CO2 in <GlossaryTerm term="ppm" />
        </>
      ),
      legend: "Purple and magenta pulsing markers show emissions concentration. Larger pulses indicate higher concentration.",
      colorScale: [
        { color: "#b56dff", label: "Lower concentration" },
        { color: "#ff6bd6", label: "Higher concentration" }
      ],
      overlayConfig: { mode: "emissions", value: Number(point.emissions), intensity: 1 },
      tooltipTerms: ["carbon emissions", "ppm", "projection", "warming threshold"]
    }
  };

  return states[layer];
}

function getPoint(year: number) {
  return climateSeries.find((point) => point.year === year) ?? climateSeries[climateSeries.length - 1];
}
