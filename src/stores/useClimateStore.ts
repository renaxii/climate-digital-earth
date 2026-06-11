import { create } from "zustand";
import { climateLayers, regions, scenarios, stories, yearExtent } from "@/data/climateData";
import type { ClimateLayerKey, CountryFocusTarget, RegionId, ScenarioKey, StoryId } from "@/types/climate";

type CameraTarget = {
  lat: number;
  lon: number;
  distance: number;
};

interface ClimateState {
  selectedLayer: ClimateLayerKey;
  selectedYear: number;
  isPlaying: boolean;
  activeStoryId: StoryId | null;
  activeStoryStep: number;
  selectedRegionId: RegionId;
  focusedCountry: CountryFocusTarget | null;
  selectedScenario: ScenarioKey;
  highContrast: boolean;
  cameraTarget: CameraTarget;
  setSelectedLayer: (layer: ClimateLayerKey) => void;
  setSelectedYear: (year: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  advanceYear: () => void;
  goToYear: (year: number) => void;
  setSelectedRegionId: (regionId: RegionId) => void;
  setFocusedCountry: (country: CountryFocusTarget | null) => void;
  setSelectedScenario: (scenario: ScenarioKey) => void;
  toggleHighContrast: () => void;
  startStory: (storyId: StoryId) => void;
  stopStory: () => void;
  setStoryStep: (step: number) => void;
}

const initialStory = stories[0].slides[0];

const timelineStep = 1;

export const useClimateStore = create<ClimateState>((set, get) => ({
  selectedLayer: initialStory.layer,
  selectedYear: initialStory.year,
  isPlaying: false,
  activeStoryId: null,
  activeStoryStep: 0,
  selectedRegionId: "global",
  focusedCountry: null,
  selectedScenario: "+2.0°C",
  highContrast: false,
  cameraTarget: initialStory.camera,
  setSelectedLayer: (selectedLayer) => set({ selectedLayer }),
  setSelectedYear: (selectedYear) => set({ selectedYear }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  advanceYear: () => {
    const { selectedYear } = get();
    const nextYear = selectedYear + timelineStep > yearExtent.max ? yearExtent.min : selectedYear + timelineStep;
    set({ selectedYear: nextYear });
  },
  goToYear: (year) => set({ selectedYear: Math.min(Math.max(year, yearExtent.min), yearExtent.max) }),
  setSelectedRegionId: (selectedRegionId) => {
    const region = regions.find((entry) => entry.id === selectedRegionId) ?? regions[regions.length - 1];
    set({
      selectedRegionId,
      focusedCountry: null,
      cameraTarget: { lat: region.lat, lon: region.lon, distance: selectedRegionId === "global" ? 3.2 : 2.45 }
    });
  },
  setFocusedCountry: (focusedCountry) =>
    set({
      focusedCountry,
      activeStoryId: null,
      cameraTarget: focusedCountry
        ? { lat: focusedCountry.lat, lon: focusedCountry.lon, distance: 2.25 }
        : { lat: 0, lon: 0, distance: 3.2 }
    }),
  setSelectedScenario: (selectedScenario) => set({ selectedScenario }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  startStory: (storyId) => {
    const story = stories.find((entry) => entry.id === storyId) ?? stories[0];
    const slide = story.slides[0];

    set({
      activeStoryId: story.id,
      activeStoryStep: 0,
      selectedLayer: slide.layer,
      selectedYear: slide.year,
      selectedRegionId: slide.region,
      focusedCountry: null,
      cameraTarget: slide.camera,
      isPlaying: false
    });
  },
  stopStory: () =>
    set({
      activeStoryId: null,
      activeStoryStep: 0
    }),
  setStoryStep: (activeStoryStep) => {
    const { activeStoryId } = get();
    if (!activeStoryId) {
      return;
    }

    const story = stories.find((entry) => entry.id === activeStoryId);
    if (!story) {
      return;
    }

    const slide = story.slides[Math.min(activeStoryStep, story.slides.length - 1)];
    set({
      activeStoryStep,
      selectedLayer: slide.layer,
      selectedYear: slide.year,
      selectedRegionId: slide.region,
      focusedCountry: null,
      cameraTarget: slide.camera
    });
  }
}));

export const climateStoreData = {
  layers: climateLayers,
  regions,
  scenarios,
  stories,
  yearExtent
};
