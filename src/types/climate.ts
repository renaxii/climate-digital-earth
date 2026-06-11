export type ClimateLayerKey =
  | "temperature"
  | "seaIce"
  | "wildfire"
  | "emissions"
  | "seaLevel";

export type ScenarioKey = "+1.5°C" | "+2.0°C" | "+3.0°C" | "+4.0°C";

export type StoryId = "arctic" | "warming" | "oceans";

export type RegionId = "arctic" | "amazon" | "pacific" | "europe" | "global";

export interface ClimateYearPoint {
  year: number;
  temperature: number;
  seaIce: number;
  wildfire: number;
  emissions: number;
  seaLevel: number;
  observed?: boolean;
}

export interface CountryFocusTarget {
  id: string;
  name: string;
  iso3: string;
  lat: number;
  lon: number;
  population?: number;
}

export interface GeoCountryFeature {
  id: string;
  type: "Feature";
  properties: {
    name: string;
    iso_a3: string;
    iso_a2?: string;
    region?: string;
    subregion?: string;
    centroid?: {
      lat: number;
      lon: number;
    };
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoCountryFeatureCollection {
  type: "FeatureCollection";
  metadata?: {
    generatedAt: string;
    source: string;
    notes?: string[];
  };
  features: GeoCountryFeature[];
}

export interface GeneratedClimateDataset {
  metadata: {
    generatedAt: string;
    latestObservedYear: number;
    sources: Record<string, string>;
    notes: string[];
  };
  series: ClimateYearPoint[];
}

export interface GeneratedCountryFocusDataset {
  metadata: {
    generatedAt: string;
    source: string;
  };
  countries: CountryFocusTarget[];
}

export interface RegionDatum {
  id: RegionId;
  name: string;
  lat: number;
  lon: number;
  headline: string;
  description: string;
  years: ClimateYearPoint[];
}

export interface ClimateLayerDefinition {
  key: ClimateLayerKey;
  label: string;
  shortLabel: string;
  accent: string;
  legend: string;
  explanation: string;
}

export interface StorySlide {
  id: string;
  title: string;
  year: number;
  layer: ClimateLayerKey;
  region: RegionId;
  camera: {
    lat: number;
    lon: number;
    distance: number;
  };
  narrative: string;
}

export interface StoryDefinition {
  id: StoryId;
  title: string;
  subtitle: string;
  color: string;
  slides: StorySlide[];
}

export interface ScenarioDefinition {
  key: ScenarioKey;
  label: string;
  note: string;
  multiplier: number;
}
