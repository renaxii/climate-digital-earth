"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { climateSeries, countryFocusTargets, latestObservedYear } from "@/data/climateData";
import type { ClimateLayerKey, CountryFocusTarget } from "@/types/climate";

const ImmersiveEarth = dynamic(() => import("@/components/experience/immersive-earth").then((module) => module.ImmersiveEarth), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_46%,rgba(91,194,255,0.18),transparent_34%)]" />
})

type StorySlide = {
  id: string;
  label: string;
  layer: ClimateLayerKey | "overview";
  year: number;
  camera: {
    lat: number;
    lon: number;
    distance: number;
  };
};

type ClimateTabKey = ClimateLayerKey | "overview";

const glossary = {
  "temperature anomaly": "How much warmer or cooler a year is compared with a long-term average.",
  "sea ice extent": "The ocean area with enough floating ice to count as ice-covered.",
  "carbon emissions": "Carbon dioxide released into the air, mostly from burning fossil fuels.",
  ppm: "Parts per million: a way to count tiny amounts of gas in the atmosphere.",
  "sea level rise": "The long-term increase in ocean height along coasts and globally.",
  albedo: "How much sunlight a surface reflects. Bright ice reflects more than dark ocean.",
  "climate scenario": "A possible climate path based on choices, emissions, and warming.",
  projection: "A model-based estimate of what could happen under certain assumptions.",
  "warming threshold": "A temperature level where climate risks become more likely or severe.",
  "fire weather": "Hot, dry, windy conditions that can make fires easier to start and spread."
} as const;

type GlossaryKey = keyof typeof glossary;

type LayerState = {
  id: ClimateTabKey;
  label: string;
  title: string;
  description: ReactNode;
  year: number;
  stat: string;
  statLabel: ReactNode;
  legend: string;
  colorScale: Array<{ color: string; label: string }>;
  overlayConfig: {
    mode: ClimateLayerKey | "overview";
    value: number;
    intensity: number;
  };
  tooltipTerms: GlossaryKey[];
};

const slides: StorySlide[] = [
  {
    id: "overview",
    label: "Overview",
    layer: "overview",
    year: latestObservedYear,
    camera: { lat: 12, lon: -34, distance: 3.25 }
  },
  {
    id: "warming",
    label: "Warming",
    layer: "temperature",
    year: latestObservedYear,
    camera: { lat: 20, lon: -12, distance: 2.8 }
  },
  {
    id: "ice",
    label: "Ice Loss",
    layer: "seaIce",
    year: latestObservedYear,
    camera: { lat: 78, lon: -42, distance: 2.45 }
  },
  {
    id: "seas",
    label: "Seas",
    layer: "seaLevel",
    year: latestObservedYear,
    camera: { lat: -16, lon: -165, distance: 2.65 }
  },
  {
    id: "wildfires",
    label: "Wildfires",
    layer: "wildfire",
    year: latestObservedYear,
    camera: { lat: -7, lon: -58, distance: 2.7 }
  },
  {
    id: "carbon",
    label: "Carbon",
    layer: "emissions",
    year: latestObservedYear,
    camera: { lat: 31, lon: 88, distance: 2.7 }
  }
];

const selectableRegionIds = new Set(["010", "036", "076", "124", "156", "250", "304", "356", "392", "826", "840"]);

const panelClass = "exhibit-panel";
const nestedPanelClass = "exhibit-panel-nested";
const iconButtonClass = "focus-ring exhibit-control inline-flex h-10 w-10 items-center justify-center";
const pillButtonClass = "focus-ring exhibit-pill px-4 py-2 text-sm";

export function ImmersiveExperience() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedCountry, setFocusedCountry] = useState<CountryFocusTarget | null>(null);
  const [isGlobeUserPaused, setIsGlobeUserPaused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const selectableRegions = useMemo(
    () => [
      ...countryFocusTargets.filter((country) => selectableRegionIds.has(country.id)),
      { id: "arctic-region", name: "Arctic region", iso3: "ARC", lat: 78, lon: -42 }
    ],
    []
  );
  const activeSlide = slides[activeIndex] ?? slides[0];
  const activeLayerState = getLayerState(activeSlide.layer, activeSlide.year);
  const camera = focusedCountry ? { lat: focusedCountry.lat, lon: focusedCountry.lon, distance: 2.18 } : activeSlide.camera;
  const visualMode: ClimateLayerKey | "overview" = activeLayerState.overlayConfig.mode;
  const overlayIntensity = activeLayerState.overlayConfig.intensity;
  const layerValue = activeLayerState.overlayConfig.value;
  const isGlobeAutoRotating = !isGlobeUserPaused && !focusedCountry;
  const globeLayer: ClimateLayerKey = activeSlide.layer === "overview" ? "temperature" : activeSlide.layer;

  const goToSlide = useCallback((index: number) => {
    const nextIndex = (index + slides.length) % slides.length;
    setActiveIndex(nextIndex);
    setFocusedCountry(null);
  }, []);

  const goNext = useCallback(() => goToSlide(activeIndex + 1), [activeIndex, goToSlide]);
  const goPrevious = useCallback(() => goToSlide(activeIndex - 1), [activeIndex, goToSlide]);

  const pauseGlobeForInteraction = useCallback(() => {
    setIsGlobeUserPaused(true);
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
    }
    resumeTimer.current = window.setTimeout(() => {
      setIsGlobeUserPaused(false);
      resumeTimer.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goNext();
      }
      if (event.key === "ArrowLeft") {
        goPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious]);

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
      className="relative h-[100vh] w-full overflow-hidden bg-[#020814] text-white"
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_44%,rgba(65,145,215,0.2),transparent_36%),linear-gradient(180deg,#010714_0%,#04111f_56%,#020711_100%)]" />

      <section className="absolute inset-0 z-0 md:left-[30vw]">
        <ImmersiveEarth
          layer={globeLayer}
          visualMode={visualMode}
          overlayIntensity={overlayIntensity}
          layerValue={layerValue}
          camera={camera}
          focusedCountry={focusedCountry}
          selectableCountries={selectableRegions}
          autoRotate={isGlobeAutoRotating}
          resetSignal={resetSignal}
          onFocusCountry={(country) => {
            setFocusedCountry(country);
            pauseGlobeForInteraction();
          }}
          onUserInteraction={pauseGlobeForInteraction}
        />
      </section>

      <div className="relative z-10 grid h-full gap-[clamp(0.85rem,1.5vw,1.35rem)] p-[clamp(1rem,2vw,2rem)] [grid-template-rows:auto_minmax(0,1fr)] lg:[grid-template-columns:clamp(25rem,32vw,35rem)_minmax(0,1fr)_clamp(12rem,14vw,16rem)]">
        <AnimatePresence mode="wait">
          <motion.article
            key={activeSlide.id}
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            className={`${panelClass} themed-scrollbar z-10 row-start-2 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-visible p-[clamp(1.35rem,2vw,1.9rem)] lg:col-start-1 lg:row-start-1 lg:row-end-3 lg:max-h-[calc(100vh-8.5rem)] lg:max-w-[35rem]`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 whitespace-nowrap text-xs uppercase tracking-[0.18em] text-white/58">{activeSlide.label}</p>
              <p className="font-mono text-xs text-white/58">{activeSlide.year}</p>
            </div>

            <h1 className="mt-5 break-normal py-1 font-display text-[clamp(1.9rem,3.2vw,2.85rem)] leading-[1.18] text-white">{activeLayerState.title}</h1>
            <p className="mt-4 max-w-[30rem] break-normal text-[0.92rem] leading-7 text-white/74">{activeLayerState.description}</p>

            <div className="mt-7 border-t border-white/10 pt-5">
              <div className="min-w-0">
                <p className="break-normal font-display text-[clamp(2rem,3.6vw,2.85rem)] leading-none text-white">{activeLayerState.stat}</p>
                <p className="mt-2 break-normal text-xs uppercase leading-5 tracking-[0.16em] text-white/58">{activeLayerState.statLabel}</p>
              </div>
            </div>

            <CompactLegend layerState={activeLayerState} />

            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/58">
              Climate changes are connected, but each layer shows a different part of the system: warming is the overall trend, ice loss is one visible result, rising seas affect coastlines, wildfires show land impacts, and carbon shows the atmospheric driver.
            </p>

            {activeLayerState.tooltipTerms.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-5 text-white/68">
                <span className="shrink-0 uppercase tracking-[0.14em] text-white/46">Terms</span>
                {activeLayerState.tooltipTerms.map((term) => (
                  <GlossaryTerm key={term} term={term} />
                ))}
              </div>
            ) : null}

            {focusedCountry ? (
              <RegionDetailCard country={focusedCountry} layerState={activeLayerState} className="mt-5 lg:hidden" />
            ) : null}

            {focusedCountry ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setFocusedCountry(null);
                    setResetSignal((value) => value + 1);
                  }}
                  className={pillButtonClass}
                  aria-label="Clear focused country"
                  title="Clear focus"
                >
                  Clear focus
                </button>
              </div>
            ) : null}
          </motion.article>
        </AnimatePresence>

        <header className="z-20 row-start-1 flex min-w-0 items-start justify-end gap-3 lg:col-start-2 lg:col-end-4">
          <div className="min-w-0 max-w-full">
            <div className="no-scrollbar exhibit-control flex max-w-full overflow-x-auto p-1 lg:max-w-none" aria-label="Climate section selector">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  aria-label={`Show ${slide.label}`}
                  onClick={() => {
                    goToSlide(index);
                  }}
                  className={`tab-button nav-item focus-ring shrink-0 rounded-full px-4 py-2 text-[0.7rem] leading-none transition ${index === activeIndex ? "bg-white/92 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  {slide.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => {
                setFocusedCountry(null);
                setIsGlobeUserPaused(false);
                setResetSignal((value) => value + 1);
              }}
              className={iconButtonClass}
              aria-label="Reset globe view"
              title="Reset globe view"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <aside className="z-10 row-start-2 hidden min-h-0 flex-col gap-4 self-end lg:col-start-3 lg:flex">
          {focusedCountry ? <RegionDetailCard country={focusedCountry} layerState={activeLayerState} /> : null}
        </aside>
      </div>
    </main>
  );
}

function CompactLegend({ layerState }: { layerState: LayerState }) {
  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="mb-3 break-normal text-xs leading-5 text-white/58">{layerState.legend}</p>
      <div className="space-y-2">
        {layerState.colorScale.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="h-2 w-7 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 break-normal text-[0.66rem] uppercase leading-4 tracking-[0.1em] text-white/62">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionDetailCard({ country, layerState, className = "" }: { country: CountryFocusTarget; layerState: LayerState; className?: string }) {
  const trendTone = layerState.id === "seaIce" ? "Decreasing" : layerState.id === "seaLevel" || layerState.id === "emissions" || layerState.id === "temperature" ? "Rising" : "Elevated";

  return (
    <section className={`${panelClass} p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-cyan-50/66">Selected region</p>
          <h2 className="mt-2 break-normal font-display text-2xl leading-tight text-white">{country.name}</h2>
        </div>
        <span className={`${nestedPanelClass} shrink-0 whitespace-nowrap px-3 py-1.5 text-xs text-white/76`}>{layerState.label}</span>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="break-normal font-display text-3xl leading-none text-white">{layerState.stat}</p>
        <p className="mt-2 break-normal text-xs uppercase leading-5 tracking-[0.16em] text-white/62">{layerState.statLabel}</p>
      </div>

      <p className="mt-4 break-normal text-sm leading-6 text-white/76">{getRegionExplanation(country, layerState)}</p>

      <div className={`${nestedPanelClass} mt-4 flex items-center justify-between gap-4 px-3 py-2`}>
        <span className="shrink-0 whitespace-nowrap text-xs uppercase tracking-[0.16em] text-white/58">Mini trend</span>
        <span className="font-mono text-sm text-cyan-50">{trendTone}</span>
      </div>
    </section>
  );
}

function GlossaryTerm({ term }: { term: GlossaryKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const touchHandled = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const tooltipWidth = 224;
      const viewportPadding = 16;
      const left = Math.min(Math.max(rect.left + rect.width / 2, viewportPadding + tooltipWidth / 2), window.innerWidth - viewportPadding - tooltipWidth / 2);
      const shouldOpenBelow = rect.top < 120;
      const top = shouldOpenBelow ? Math.min(rect.bottom + 12, window.innerHeight - viewportPadding) : Math.max(rect.top - 12, viewportPadding);
      setTooltipStyle({
        left,
        top,
        width: tooltipWidth,
        transform: shouldOpenBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)"
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-flex align-baseline">
      <button
        ref={buttonRef}
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
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isOpen && tooltipStyle ? (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={tooltipStyle}
            className="pointer-events-none fixed z-[2147483000] break-words rounded-[20px] border border-white/14 bg-[#071827]/95 px-3 py-2 text-left text-xs normal-case leading-5 tracking-normal text-white/88 shadow-2xl backdrop-blur-2xl"
          >
            {glossary[term]}
          </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </span>
  );
}

function getLayerState(layer: ClimateTabKey, year: number): LayerState {
  const point = getPoint(year);

  const states: Record<ClimateTabKey, LayerState> = {
    overview: {
      id: "overview",
      label: "Overview",
      title: "Earth, seen as one connected system.",
      description: "A general view of the planet before focusing on individual climate signals. Use the tabs above to compare warming, ice, seas, wildfires, and carbon.",
      year,
      stat: `${year}`,
      statLabel: "Latest observed climate view",
      legend: "The overview keeps the globe natural, with no active data overlay. Colored layers appear when you choose a climate concept.",
      colorScale: [
        { color: "#0d3f68", label: "Ocean" },
        { color: "#f4fbff", label: "Clouds and polar ice" }
      ],
      overlayConfig: { mode: "overview", value: 0, intensity: 0 },
      tooltipTerms: []
    },
    temperature: {
      id: "temperature",
      label: "Warming",
      title: "Warming is the overall trend.",
      description: (
        <>
          Shows how global temperatures differ from a historical baseline. Scientists track this as a <GlossaryTerm term="temperature anomaly" />.
        </>
      ),
      year,
      stat: `${point.temperature.toFixed(2)} deg C`,
      statLabel: (
        <>
          NASA GISTEMP <GlossaryTerm term="temperature anomaly" />
        </>
      ),
      legend: "Blue marks cooler-than-baseline conditions, white is near average, and yellow through red marks increasing warming.",
      colorScale: [
        { color: "linear-gradient(90deg,#4bbcff,#f7fbff,#ffe58a,#ff6b3d)", label: "Cooler to warmer anomaly" }
      ],
      overlayConfig: { mode: "temperature", value: Number(point.temperature), intensity: 1 },
      tooltipTerms: ["temperature anomaly"]
    },
    seaIce: {
      id: "seaIce",
      label: "Ice Loss",
      title: "Ice loss is visible from orbit.",
      description: (
        <>
          Shows shrinking polar ice coverage, especially in the Arctic and Antarctic. Less bright ice lowers <GlossaryTerm term="albedo" /> and exposes darker surfaces.
        </>
      ),
      year,
      stat: `${point.seaIce.toFixed(1)}M km2`,
      statLabel: (
        <>
          September Arctic <GlossaryTerm term="sea ice extent" />
        </>
      ),
      legend: "Pale cyan shows current sea ice coverage, white shows the historical average ice edge, and bright cyan outlines areas of major loss.",
      colorScale: [
        { color: "#8ff6ff", label: "Current sea ice coverage" },
        { color: "#ffffff", label: "Historical average ice edge" },
        { color: "#00b7ff", label: "Major loss outline" }
      ],
      overlayConfig: { mode: "seaIce", value: Number(point.seaIce), intensity: 1 },
      tooltipTerms: ["sea ice extent", "albedo"]
    },
    wildfire: {
      id: "wildfire",
      label: "Wildfires",
      title: "Fire activity is intensifying.",
      description: (
        <>
          Hotter, drier extremes can intensify <GlossaryTerm term="fire weather" /> when ignition and fuel conditions line up.
        </>
      ),
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
      tooltipTerms: ["fire weather"]
    },
    seaLevel: {
      id: "seaLevel",
      label: "Seas",
      title: "Rising seas affect coastlines.",
      description: (
        <>
          Shows coastal risk from ocean expansion and melting land ice, making <GlossaryTerm term="sea level rise" /> a long-lived coastal story.
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
      label: "Carbon",
      title: "Carbon concentration keeps climbing.",
      description: (
        <>
          This view connects <GlossaryTerm term="carbon emissions" /> to atmospheric concentration, measured in <GlossaryTerm term="ppm" />, and long-term climate risk.
        </>
      ),
      year,
      stat: `${point.emissions.toFixed(0)} ppm`,
      statLabel: (
        <>
          Atmospheric carbon in <GlossaryTerm term="ppm" />
        </>
      ),
      legend: "Warm pulsing markers show emissions concentration. Larger pulses indicate higher concentration.",
      colorScale: [
        { color: "#ffcf7a", label: "Lower concentration" },
        { color: "#ff8a34", label: "Higher concentration" }
      ],
      overlayConfig: { mode: "emissions", value: Number(point.emissions), intensity: 1 },
      tooltipTerms: ["carbon emissions", "ppm"]
    }
  };

  return states[layer];
}

function getRegionExplanation(country: CountryFocusTarget, layerState: LayerState) {
  const name = country.name;

  if (layerState.id === "overview") {
    return `${name} is selected on the natural Earth view. Choose a climate tab to see a specific data layer for this region.`;
  }

  if (layerState.id === "temperature") {
    return `${name} is shown through the active temperature anomaly layer, connecting the selected region to the broader warming signal.`;
  }

  if (layerState.id === "seaIce") {
    return name === "Greenland" || name === "Arctic region" || name === "Canada"
      ? `${name} sits near the polar ice story, where bright ice loss changes reflectivity and exposes darker ocean or land surfaces.`
      : `${name} remains selected while the globe highlights polar sea ice, showing how distant cryosphere change still shapes global climate.`;
  }

  if (layerState.id === "wildfire") {
    return `${name} is framed through fire-weather pressure: hotter and drier extremes can make landscapes more vulnerable when fuels and ignition align.`;
  }

  if (layerState.id === "seaLevel") {
    return `${name} is viewed with the coastal risk layer, where cyan glow marks rising-water exposure around shorelines.`;
  }

  return `${name} is connected to the Carbon layer, where pulsing markers indicate emissions concentration and the atmospheric driver behind long-term change.`;
}
function getPoint(year: number) {
  return climateSeries.find((point) => point.year === year) ?? climateSeries[climateSeries.length - 1];
}
