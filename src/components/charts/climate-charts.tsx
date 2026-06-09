"use client";

import { type ReactNode, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Card } from "@/components/ui/card";
import { climateSeries, regions, scenarios } from "@/data/climateData";
import type { ClimateLayerKey, RegionId } from "@/types/climate";

interface ClimateChartsProps {
  selectedLayer: ClimateLayerKey;
  selectedYear: number;
  selectedRegionId: RegionId;
}

export function ClimateCharts({ selectedLayer, selectedYear, selectedRegionId }: ClimateChartsProps) {
  const region = regions.find((entry) => entry.id === selectedRegionId) ?? regions[regions.length - 1];
  const layerLabel = selectedLayer.replace(/([A-Z])/g, " $1");
  const selectedIndex = climateSeries.findIndex((entry) => entry.year === selectedYear);
  const current = climateSeries[Math.max(0, selectedIndex)];
  const regionSeries = useMemo(() => region.years, [region]);

  const temperatureData = climateSeries.map((entry) => ({ year: entry.year, value: entry.temperature }));
  const iceData = climateSeries.map((entry) => ({ year: entry.year, value: entry.seaIce }));
  const emissionsData = climateSeries.map((entry) => ({ year: entry.year, value: entry.emissions }));
  const seaLevelData = climateSeries.map((entry) => ({ year: entry.year, value: entry.seaLevel }));

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Data visualization</p>
          <h2 className="mt-1 font-display text-2xl text-white">Animated climate trends</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/64">{layerLabel.trim()} · {selectedYear}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Temperature trend" subtitle={`${region.name} · ${current.temperature.toFixed(2)}°C anomaly`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temperatureData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "rgba(4, 16, 30, 0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
              <Line type="monotone" dataKey="value" stroke="#67d8ff" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ice extent trend" subtitle="The Arctic system continues its long decline.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={iceData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="iceFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d2f8ff" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#d2f8ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "rgba(4, 16, 30, 0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
              <Area type="monotone" dataKey="value" stroke="#d2f8ff" fill="url(#iceFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emissions trend" subtitle="CO2 remains the long-term driver of warming.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={emissionsData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "rgba(4, 16, 30, 0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
              <Line type="monotone" dataKey="value" stroke="#8cffc1" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sea level trend" subtitle="Long-lived ocean response is especially important for coastal cities.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seaLevelData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.42)" tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "rgba(4, 16, 30, 0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
              <Bar dataKey="value" fill="#87b8ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((scenario) => (
          <div key={scenario.key} className="rounded-3xl bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/54">Projection</div>
            <div className="mt-2 text-lg font-semibold text-white">{scenario.label}</div>
            <div className="mt-1 text-sm leading-6 text-white/66">{scenario.note}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-xs leading-5 text-white/60">{subtitle}</div>
        </div>
      </div>
      <div className="h-[220px]">{children}</div>
    </div>
  );
}
