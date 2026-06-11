import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GENERATED_DIR = join(ROOT, "src", "data", "generated");

const SOURCES = {
  temperature: "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
  co2: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.txt",
  countriesTopo: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
};

const SEA_ICE_EXTENT = new Map([
  [1979, 7.05], [1980, 7.67], [1981, 7.14], [1982, 7.30], [1983, 7.39], [1984, 6.81], [1985, 6.70], [1986, 7.41],
  [1987, 7.28], [1988, 7.37], [1989, 7.01], [1990, 6.14], [1991, 6.47], [1992, 7.47], [1993, 6.40], [1994, 7.14],
  [1995, 6.08], [1996, 7.58], [1997, 6.69], [1998, 6.54], [1999, 6.12], [2000, 6.25], [2001, 6.73], [2002, 5.83],
  [2003, 6.12], [2004, 5.98], [2005, 5.50], [2006, 5.86], [2007, 4.27], [2008, 4.69], [2009, 5.26], [2010, 4.87],
  [2011, 4.56], [2012, 3.39], [2013, 5.05], [2014, 5.03], [2015, 4.43], [2016, 4.17], [2017, 4.67], [2018, 4.66],
  [2019, 4.19], [2020, 3.82], [2021, 4.72], [2022, 4.67], [2023, 4.23], [2024, 4.28], [2025, 4.60]
]);

const SEA_LEVEL_MM = new Map([
  [1993, 0.0], [1994, 2.8], [1995, 5.0], [1996, 8.2], [1997, 11.0], [1998, 12.8], [1999, 14.7], [2000, 17.4],
  [2001, 20.1], [2002, 23.3], [2003, 26.9], [2004, 29.0], [2005, 33.0], [2006, 36.2], [2007, 39.7], [2008, 43.3],
  [2009, 46.1], [2010, 49.7], [2011, 51.7], [2012, 56.0], [2013, 60.1], [2014, 64.0], [2015, 69.2], [2016, 73.5],
  [2017, 77.8], [2018, 82.4], [2019, 87.6], [2020, 91.3], [2021, 94.8], [2022, 98.2], [2023, 101.0], [2024, 106.9]
]);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "climate-digital-earth-data-build/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "climate-digital-earth-data-build/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function parseGistemp(csv) {
  const rows = csv.split(/\r?\n/).filter(Boolean);
  const data = new Map();
  const headerIndex = rows.findIndex((row) => row.startsWith("Year,"));

  if (headerIndex < 0) {
    throw new Error("Unable to find NASA GISTEMP header row.");
  }

  const header = rows[headerIndex].split(",");
  const annualIndex = header.indexOf("J-D");

  if (annualIndex < 0) {
    throw new Error("Unable to find NASA GISTEMP annual J-D column.");
  }

  for (const row of rows.slice(headerIndex + 1)) {
    const columns = row.split(",");
    const year = Number(columns[0]);
    const annual = Number(columns[annualIndex]);

    if (Number.isFinite(year) && Number.isFinite(annual)) {
      data.set(year, annual);
    }
  }

  return data;
}

function parseNoaaCo2(text) {
  const data = new Map();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [yearText, meanText] = trimmed.split(/\s+/);
    const year = Number(yearText);
    const mean = Number(meanText);

    if (Number.isFinite(year) && Number.isFinite(mean)) {
      data.set(year, mean);
    }
  }

  return data;
}

function getNearestObserved(data, year) {
  if (data.has(year)) {
    return data.get(year);
  }

  const years = [...data.keys()].sort((a, b) => a - b);
  const nearest = years.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best), years[0]);
  return data.get(nearest);
}

function projectValue(data, year, windowSize = 10) {
  if (data.has(year)) {
    return data.get(year);
  }

  const years = [...data.keys()].sort((a, b) => a - b);
  const latestYear = years.at(-1);
  const latest = data.get(latestYear);
  const startYear = years[Math.max(0, years.length - windowSize - 1)];
  const start = data.get(startYear);
  const annualDelta = (latest - start) / (latestYear - startYear);

  return latest + annualDelta * (year - latestYear);
}

function buildSeries({ temperature, co2 }) {
  const minYear = Math.max(1980, Math.min(...temperature.keys()), Math.min(...co2.keys()));
  const latestObserved = Math.min(Math.max(...temperature.keys()), Math.max(...co2.keys()), Math.max(...SEA_ICE_EXTENT.keys()), Math.max(...SEA_LEVEL_MM.keys()));
  const maxYear = latestObserved + 10;
  const series = [];

  for (let year = minYear; year <= maxYear; year += 1) {
    const temperatureValue = projectValue(temperature, year, 12);
    const co2Value = projectValue(co2, year, 10);
    const seaIce = projectValue(SEA_ICE_EXTENT, year, 10);
    const seaLevel = projectValue(SEA_LEVEL_MM, Math.max(year, 1993), 10);
    const wildfire = Math.max(0, 42 + (temperatureValue - getNearestObserved(temperature, minYear)) * 34 + (co2Value - getNearestObserved(co2, minYear)) * 0.22);

    series.push({
      year,
      temperature: round(temperatureValue, 2),
      seaIce: round(seaIce, 2),
      wildfire: round(wildfire, 0),
      emissions: round(co2Value, 2),
      seaLevel: year < 1993 ? 0 : round(seaLevel, 1),
      observed: year <= latestObserved
    });
  }

  return { series, latestObserved };
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function ringCentroid(ring) {
  let area = 0;
  let x = 0;
  let y = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x0, y0] = ring[index];
    const [x1, y1] = ring[index + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  if (Math.abs(area) < 0.000001) {
    const totals = ring.reduce((acc, [lon, lat]) => ({ lon: acc.lon + lon, lat: acc.lat + lat }), { lon: 0, lat: 0 });
    return { lon: totals.lon / ring.length, lat: totals.lat / ring.length, area: 0 };
  }

  return { lon: x / (3 * area), lat: y / (3 * area), area: Math.abs(area / 2) };
}

function featureCentroid(country) {
  const polygons = country.geometry.type === "Polygon" ? [country.geometry.coordinates] : country.geometry.coordinates;
  const largestRing = polygons
    .map((polygon) => ringCentroid(polygon[0]))
    .sort((a, b) => b.area - a.area)[0];

  return {
    lon: round(largestRing.lon, 2),
    lat: round(largestRing.lat, 2)
  };
}

function simplifyRing(ring) {
  const step = ring.length > 90 ? Math.ceil(ring.length / 90) : 1;
  const simplified = ring.filter((_, index) => index % step === 0);
  const first = simplified[0];
  const last = simplified.at(-1);

  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    simplified.push(first);
  }

  return simplified.map(([lon, lat]) => [round(lon, 2), round(lat, 2)]);
}

function simplifyGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(simplifyRing)
    };
  }

  return {
    ...geometry,
    coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing))
  };
}

async function buildCountryArtifacts() {
  const topo = await fetchJson(SOURCES.countriesTopo);
  const countries = feature(topo, topo.objects.countries);
  const features = countries.features
    .filter((country) => country.properties?.name && country.geometry)
    .map((country) => {
      const centroid = featureCentroid(country);
      return {
        id: String(country.id ?? country.properties.name).padStart(3, "0"),
        type: "Feature",
        properties: {
          name: country.properties.name,
          iso_a3: String(country.id ?? "").padStart(3, "0"),
          centroid
        },
        geometry: simplifyGeometry(country.geometry)
      };
    })
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name));

  return {
    geojson: {
      type: "FeatureCollection",
      metadata: {
        source: SOURCES.countriesTopo,
        generatedAt: new Date().toISOString(),
        notes: ["Converted from the Natural Earth 110m TopoJSON package published through world-atlas."]
      },
      features
    },
    focusTargets: features.map((country) => ({
      id: country.id,
      name: country.properties.name,
      iso3: country.properties.iso_a3,
      lat: country.properties.centroid.lat,
      lon: country.properties.centroid.lon
    })),
    topo
  };
}

async function main() {
  await mkdir(GENERATED_DIR, { recursive: true });

  const [temperatureCsv, co2Text, countryArtifacts] = await Promise.all([
    fetchText(SOURCES.temperature),
    fetchText(SOURCES.co2),
    buildCountryArtifacts()
  ]);

  const temperature = parseGistemp(temperatureCsv);
  const co2 = parseNoaaCo2(co2Text);
  const { series, latestObserved } = buildSeries({ temperature, co2 });
  const generatedAt = new Date().toISOString();

  const dataset = {
    metadata: {
      generatedAt,
      latestObservedYear: latestObserved,
      sources: {
        nasaGistemp: SOURCES.temperature,
        noaaCo2: SOURCES.co2,
        nasaSeaLevel: "NASA satellite altimetry global mean sea level values, normalized to 1993 baseline.",
        noaaNsidcSeaIce: "NOAA/NSIDC September Arctic sea ice minimum extent values in million square kilometers.",
        countries: SOURCES.countriesTopo
      },
      notes: [
        "Temperature values are NASA GISTEMP annual global surface temperature anomalies in degrees Celsius.",
        "Emissions layer uses NOAA Global Monitoring Laboratory annual mean atmospheric CO2 in ppm.",
        "Sea ice and sea level are persisted as annual observed indicator values and extrapolated after the latest shared observation year.",
        "Wildfire is an educational pressure index derived from observed warming and CO2; it is not an observed burned-area measurement.",
        "Rows where observed is false are simple trend extensions for exhibit timeline continuity."
      ]
    },
    series
  };

  await Promise.all([
    writeJson("climate-series.json", dataset),
    writeJson("countries.geo.json", countryArtifacts.geojson),
    writeJson("countries.topo.json", countryArtifacts.topo),
    writeJson("country-focus-targets.json", {
      metadata: {
        generatedAt,
        source: SOURCES.countriesTopo
      },
      countries: countryArtifacts.focusTargets
    })
  ]);

  console.log(`Wrote ${series.length} annual climate points through ${series.at(-1).year}.`);
  console.log(`Wrote ${countryArtifacts.geojson.features.length} country overlays.`);
}

async function writeJson(fileName, value) {
  await writeFile(join(GENERATED_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
