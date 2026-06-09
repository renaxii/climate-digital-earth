"use client";

import { stories } from "@/data/climateData";
import { useClimateStore } from "@/stores/useClimateStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StoryModePanelProps {
  storyId: string;
}

export function StoryModePanel({ storyId }: StoryModePanelProps) {
  const story = stories.find((entry) => entry.id === storyId) ?? stories[0];
  const { activeStoryStep, setStoryStep, stopStory } = useClimateStore();
  const step = Math.min(activeStoryStep, story.slides.length - 1);
  const slide = story.slides[step];

  return (
    <div className="space-y-4">
      <Card className="space-y-4 bg-white/6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Current story</p>
          <h3 className="mt-1 font-display text-2xl text-white">{story.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/68">{slide.narrative}</p>
        </div>

        <div className="flex items-center gap-2">
          {story.slides.map((entry, index) => (
            <button
              key={entry.id}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setStoryStep(index)}
              className={`h-2.5 flex-1 rounded-full transition ${index <= step ? "bg-cyan-300" : "bg-white/12"}`}
            />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Badge label="Year" value={slide.year.toString()} />
          <Badge label="Layer" value={slide.layer} />
          <Badge label="Region" value={slide.region} />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {story.slides.map((entry, index) => (
          <Button key={entry.id} variant={index === step ? "primary" : "secondary"} onClick={() => setStoryStep(index)}>
            Slide {index + 1}
          </Button>
        ))}
        <Button variant="ghost" onClick={stopStory}>Exit story</Button>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
