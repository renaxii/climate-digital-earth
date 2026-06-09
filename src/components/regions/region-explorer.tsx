"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { regions } from "@/data/climateData";
import type { RegionId } from "@/types/climate";

interface RegionExplorerProps {
  selectedRegionId: RegionId;
  onSelectRegion: (regionId: RegionId) => void;
  onClearStory: () => void;
}

export function RegionExplorer({ selectedRegionId, onSelectRegion, onClearStory }: RegionExplorerProps) {
  const [query, setQuery] = useState("");
  const filteredRegions = useMemo(() => regions.filter((region) => region.name.toLowerCase().includes(query.toLowerCase())), [query]);

  const activeRegion = regions.find((region) => region.id === selectedRegionId) ?? regions[regions.length - 1];

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Search className="h-4 w-4 text-white/45" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a country or region"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/38"
        />
      </label>

      <div className="max-h-[280px] space-y-2 overflow-auto pr-1">
        {filteredRegions.map((region) => (
          <button
            key={region.id}
            onClick={() => {
              onSelectRegion(region.id);
              onClearStory();
            }}
            className={`focus-ring w-full rounded-2xl border px-4 py-3 text-left transition ${selectedRegionId === region.id ? "border-cyan-200/25 bg-cyan-200/14" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-100/80" />
              <span className="font-semibold text-white">{region.name}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-white/64">{region.headline}</p>
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">{activeRegion.name}</p>
        <p className="mt-2 text-sm leading-6 text-white/66">{activeRegion.description}</p>
      </div>
    </div>
  );
}
