"use client";

import { climateLayers, regions, scenarios } from "@/data/climateData";
import type { ClimateLayerKey, RegionId, ScenarioKey } from "@/types/climate";

interface EducationalInsightsProps {
  selectedLayer: ClimateLayerKey;
  selectedRegion: RegionId;
  selectedScenario: ScenarioKey;
}

export function EducationalInsights({ selectedLayer, selectedRegion, selectedScenario }: EducationalInsightsProps) {
  const layer = climateLayers.find((entry) => entry.key === selectedLayer) ?? climateLayers[0];
  const region = regions.find((entry) => entry.id === selectedRegion) ?? regions[regions.length - 1];
  const scenario = scenarios.find((entry) => entry.key === selectedScenario) ?? scenarios[1];

  return (
    <div className="space-y-4 text-sm leading-6 text-white/72">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">What you’re viewing</p>
        <p className="mt-2">{layer.explanation} The current region focus is {region.name}, and the main projection mode is {scenario.label}.</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Why it matters</p>
        <p className="mt-2">Climate signals compound across systems. Small changes in temperature, ice, and sea level can reshape ecosystems, coastlines, infrastructure, and public health.</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Scientific note</p>
        <p className="mt-2">This exhibit uses static preprocessed datasets and clearly labels future scenarios as projections rather than forecasts.</p>
      </div>
    </div>
  );
}
