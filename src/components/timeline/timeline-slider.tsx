"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipForward } from "lucide-react";
import { latestObservedYear, yearExtent } from "@/data/climateData";

interface TimelineSliderProps {
  year: number;
  isPlaying: boolean;
  onChange: (year: number) => void;
  onJump: (year: number) => void;
  onTogglePlay: () => void;
}

export function TimelineSlider({ year, isPlaying, onChange, onJump, onTogglePlay }: TimelineSliderProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Timeline</p>
          <h2 className="mt-1 font-display text-xl text-white">Scrub through climate history</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onTogglePlay}>
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="secondary" onClick={() => onJump(latestObservedYear)}>
            <SkipForward className="mr-2 h-4 w-4" /> Jump to latest
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-white/64">
          <span>{yearExtent.min}</span>
          <span className="font-semibold text-white">{year}</span>
          <span>{yearExtent.max}</span>
        </div>
        <input
          aria-label="Climate timeline"
          type="range"
          min={yearExtent.min}
          max={yearExtent.max}
          step={1}
          value={year}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
        />
      </div>
    </Card>
  );
}
