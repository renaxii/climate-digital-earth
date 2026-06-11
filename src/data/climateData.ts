import generatedDataset from "@/data/generated/climate-series.json";
import generatedCountries from "@/data/generated/countries.geo.json";
import generatedCountryFocusTargets from "@/data/generated/country-focus-targets.json";
import type {
  ClimateLayerDefinition,
  ClimateYearPoint,
  CountryFocusTarget,
  GeneratedClimateDataset,
  GeneratedCountryFocusDataset,
  GeoCountryFeatureCollection,
  RegionDatum,
  ScenarioDefinition,
  StoryDefinition
} from "@/types/climate";

const climateDataset = generatedDataset as GeneratedClimateDataset;
const countryDataset = generatedCountries as GeoCountryFeatureCollection;
const countryFocusDataset = generatedCountryFocusTargets as GeneratedCountryFocusDataset;

export const climateSeries: ClimateYearPoint[] = climateDataset.series;
export const years = climateSeries.map((entry) => entry.year);
export const climateMetadata = climateDataset.metadata;
export const latestObservedYear = climateMetadata.latestObservedYear;
export const countryFeatureCollection = countryDataset;
export const countryFocusTargets: CountryFocusTarget[] = countryFocusDataset.countries;

export const yearExtent = {
  min: years[0],
  max: years[years.length - 1]
};

export const climateLayers: ClimateLayerDefinition[] = [
  {
    key: "temperature",
    label: "Temperature Anomalies",
    shortLabel: "Temperature",
    accent: "#67d8ff",
    legend: "NASA GISTEMP annual global temperature anomaly.",
    explanation: "Shows how much the planet has warmed above the historical average."
  },
  {
    key: "seaIce",
    label: "Sea Ice Coverage",
    shortLabel: "Sea Ice",
    accent: "#d2f8ff",
    legend: "NOAA/NSIDC Arctic September sea-ice extent in million square kilometers.",
    explanation: "Highlights the shrinking seasonal ice shield around the poles."
  },
  {
    key: "wildfire",
    label: "Wildfire Activity",
    shortLabel: "Wildfire",
    accent: "#ff9f68",
    legend: "Educational wildfire pressure index derived from NASA warming and NOAA CO2 trends.",
    explanation: "Surfaces the rise in fire-prone conditions and larger burn areas."
  },
  {
    key: "emissions",
    label: "CO2 Emissions",
    shortLabel: "Emissions",
    accent: "#d979ff",
    legend: "NOAA Global Monitoring Laboratory annual mean atmospheric CO2.",
    explanation: "Shows the global carbon load driving atmospheric change."
  },
  {
    key: "seaLevel",
    label: "Sea Level Rise",
    shortLabel: "Sea Level",
    accent: "#87b8ff",
    legend: "NASA satellite altimetry global mean sea-level trend.",
    explanation: "Represents ocean expansion and melting land ice."
  }
];

function buildRegionalSeries(offset: number): ClimateYearPoint[] {
  return climateSeries.map((entry) => ({
    ...entry,
    temperature: Number((entry.temperature + offset * 0.12).toFixed(2)),
    seaIce: Number((entry.seaIce - offset * 0.18).toFixed(2)),
    wildfire: Number((entry.wildfire + offset * 1.3).toFixed(0)),
    emissions: Number((entry.emissions + offset * 0.5).toFixed(1)),
    seaLevel: Number((entry.seaLevel + offset * 0.08).toFixed(2))
  }));
}

function buildRegion(
  id: RegionDatum["id"],
  name: string,
  lat: number,
  lon: number,
  headline: string,
  description: string,
  offset: number
): RegionDatum {
  return {
    id,
    name,
    lat,
    lon,
    headline,
    description,
    years: buildRegionalSeries(offset)
  };
}

export const regions: RegionDatum[] = [
  buildRegion("arctic", "Arctic Circle", 76, -42, "Fastest warming zone", "The Arctic is warming several times faster than the global average, driving ice loss and ecosystem change.", 2.1),
  buildRegion("amazon", "Amazon Basin", -4, -63, "Carbon and fire hotspot", "Hotter, drier conditions are increasing fire risk and stressing a globally important carbon sink.", 1.4),
  buildRegion("pacific", "Pacific Islands", -16, -170, "Coastal resilience under pressure", "Sea level rise magnifies storm surge, erosion, and freshwater intrusion across low-lying islands.", 1.8),
  buildRegion("europe", "Europe", 52, 14, "Heatwaves and adaptation", "Recent summers show how rising heat extremes affect health, water, agriculture, and energy demand.", 1.2),
  buildRegion("global", "Global View", 0, 0, "Planetary baseline", "The global view combines temperature, emissions, ice, and sea-level signals into one narrative.", 1)
];

export const scenarios: ScenarioDefinition[] = [
  { key: "+1.5°C", label: "+1.5°C", note: "A lower-impact future that still requires rapid adaptation.", multiplier: 0.85 },
  { key: "+2.0°C", label: "+2.0°C", note: "A threshold where several systems face substantial stress.", multiplier: 1 },
  { key: "+3.0°C", label: "+3.0°C", note: "A much hotter future with pronounced extremes and losses.", multiplier: 1.35 },
  { key: "+4.0°C", label: "+4.0°C", note: "A severe projection with high risks to ecosystems and cities.", multiplier: 1.7 }
];

export const stories: StoryDefinition[] = [
  {
    id: "arctic",
    title: "The Arctic Story",
    subtitle: "Follow ice loss and accelerating warming in the far north.",
    color: "#76e8ff",
    slides: [
      {
        id: "arctic-1",
        title: "A reflective beginning",
        year: years[5] ?? yearExtent.min,
        layer: "seaIce",
        region: "arctic",
        camera: { lat: 76, lon: -42, distance: 2.9 },
        narrative: "The Arctic starts with a bright, stable ice shield that has a strong cooling influence on the planet."
      },
      {
        id: "arctic-2",
        title: "Thin ice",
        year: 2005,
        layer: "temperature",
        region: "arctic",
        camera: { lat: 78, lon: -25, distance: 2.55 },
        narrative: "Warming accelerates and sea ice retreats earlier each year, exposing darker ocean water that absorbs more heat."
      },
      {
        id: "arctic-3",
        title: "A new baseline",
        year: latestObservedYear,
        layer: "seaIce",
        region: "arctic",
        camera: { lat: 82, lon: 10, distance: 2.4 },
        narrative: "Today's Arctic is increasingly defined by thinner ice, longer melt seasons, and wider consequences for weather and habitats."
      }
    ]
  },
  {
    id: "warming",
    title: "The Warming Planet",
    subtitle: "Trace the rise of temperature and emissions together.",
    color: "#8cffc1",
    slides: [
      {
        id: "warming-1",
        title: "Pre-industrial balance",
        year: yearExtent.min,
        layer: "emissions",
        region: "global",
        camera: { lat: 0, lon: 0, distance: 3.1 },
        narrative: "Industrial emissions are already shaping the atmosphere, but the strongest warming signal is still ahead."
      },
      {
        id: "warming-2",
        title: "The climb",
        year: 2000,
        layer: "temperature",
        region: "global",
        camera: { lat: 14, lon: 18, distance: 2.95 },
        narrative: "As emissions rise, the temperature curve turns upward and climate extremes become more frequent."
      },
      {
        id: "warming-3",
        title: "A hotter baseline",
        year: latestObservedYear,
        layer: "temperature",
        region: "global",
        camera: { lat: 22, lon: 28, distance: 2.7 },
        narrative: "The modern climate begins from a warmer baseline, affecting ecosystems, cities, and food systems worldwide."
      }
    ]
  },
  {
    id: "oceans",
    title: "Rising Oceans",
    subtitle: "See how sea level rise becomes a coastal risk multiplier.",
    color: "#87b8ff",
    slides: [
      {
        id: "oceans-1",
        title: "Coastal calm",
        year: 1988,
        layer: "seaLevel",
        region: "pacific",
        camera: { lat: -16, lon: -170, distance: 2.9 },
        narrative: "Sea levels change slowly at first, but communities near the shoreline are already planning for risk."
      },
      {
        id: "oceans-2",
        title: "Higher tides",
        year: 2008,
        layer: "seaLevel",
        region: "pacific",
        camera: { lat: -12, lon: -164, distance: 2.65 },
        narrative: "Higher seas make storm surge and flooding more likely, especially when paired with intense weather."
      },
      {
        id: "oceans-3",
        title: "Projected futures",
        year: latestObservedYear,
        layer: "seaLevel",
        region: "pacific",
        camera: { lat: -8, lon: -155, distance: 2.55 },
        narrative: "Future sea-level rise is a long-lived risk that demands adaptation choices today."
      }
    ]
  }
];
