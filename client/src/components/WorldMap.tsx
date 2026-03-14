import { useRef, useEffect, useState, useMemo } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { numericIdToAlpha3 } from "../countryCodeMap";
import { useTimeline } from "../context/TimelineContext";
import { useSettings } from "../context/SettingsContext";

// We'll fetch from the world-atlas CDN
const WORLD_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryFeature extends Feature<Geometry> {
  id: string;
  properties: { name: string };
}

export default function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<FeatureCollection | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { currentYear } = useTimeline();
  const { events, filteredEvents, visibleEventIds, showInfluence } =
    useSettings();

  // Fetch world data
  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((res) => res.json())
      .then((topology: Topology) => {
        const countries = feature(
          topology,
          topology.objects.countries as GeometryCollection,
        ) as FeatureCollection;
        setWorldData(countries);
      })
      .catch((err) => console.error("Failed to load world data:", err));
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Build projection and path generator
  const { projection, pathGenerator } = useMemo(() => {
    const proj = geoNaturalEarth1().fitSize(
      [dimensions.width, dimensions.height - 80],
      { type: "Sphere" } as any,
    );
    const pg = geoPath(proj);
    return { projection: proj, pathGenerator: pg };
  }, [dimensions]);

  // Build a map of alpha3 code -> active colour + opacity for current year
  const activeOverlays = useMemo(() => {
    const overlayMap = new Map<
      string,
      { colour: string; opacity: number; name: string; isInfluence: boolean }
    >();

    // First pass: direct overlays
    for (const event of filteredEvents) {
      if (!visibleEventIds.has(event.id)) continue;
      if (currentYear < event.yearFrom || currentYear > event.yearTo) continue;

      const duration = event.yearTo - event.yearFrom;
      const elapsed = currentYear - event.yearFrom;
      const progress = duration > 0 ? elapsed / duration : 1;

      let opacity: number;
      if (progress < 0.1) {
        opacity = progress / 0.1;
      } else if (progress > 0.9) {
        opacity = (1 - progress) / 0.1;
      } else {
        opacity = 1;
      }
      opacity = Math.max(0.15, Math.min(0.65, opacity * 0.65));

      for (const code of event.locationCodes) {
        const existing = overlayMap.get(code);
        if (!existing || opacity > existing.opacity) {
          overlayMap.set(code, {
            colour: event.colour,
            opacity,
            name: event.name,
            isInfluence: false,
          });
        }
      }
    }

    // Second pass: influence overlays (lower opacity)
    if (showInfluence) {
      for (const event of events) {
        if (!visibleEventIds.has(event.id)) continue;
        if (currentYear < event.yearFrom || currentYear > event.yearTo)
          continue;

        for (const parentName of event.influencedByNames) {
          const parent = events.find((e) => e.name === parentName);
          if (!parent) continue;
          for (const code of parent.locationCodes) {
            if (overlayMap.has(code)) continue; // don't overwrite direct overlays
            overlayMap.set(code, {
              colour: event.colour,
              opacity: 0.18,
              name: `${event.name} (influenced by ${parent.name})`,
              isInfluence: true,
            });
          }
        }
      }
    }

    return overlayMap;
  }, [events, filteredEvents, visibleEventIds, currentYear, showInfluence]);

  const graticule = useMemo(() => geoGraticule()(), []);

  if (!worldData) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-950 text-gray-400">
        Loading world map...
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      className="bg-gray-950"
    >
      {/* Ocean / sphere background */}
      <path
        d={pathGenerator({ type: "Sphere" } as any) || ""}
        fill="#0c1929"
        stroke="#1e3a5f"
        strokeWidth={0.5}
      />

      {/* Graticule grid */}
      <path
        d={pathGenerator(graticule) || ""}
        fill="none"
        stroke="#1a2940"
        strokeWidth={0.3}
      />

      {/* Country base layers */}
      {(worldData.features as CountryFeature[]).map((feature) => {
        const alpha3 = numericIdToAlpha3(feature.id);
        const overlay = alpha3 ? activeOverlays.get(alpha3) : undefined;

        return (
          <path
            key={feature.id}
            d={pathGenerator(feature) || ""}
            fill={overlay ? overlay.colour : "#1a2332"}
            fillOpacity={overlay ? overlay.opacity : 1}
            stroke={overlay?.isInfluence ? overlay.colour : "#2a3a4a"}
            strokeWidth={overlay?.isInfluence ? 1.2 : 0.5}
            strokeDasharray={overlay?.isInfluence ? "4 2" : undefined}
            style={{ transition: "fill 0.3s ease, fill-opacity 0.3s ease" }}
          >
            {overlay && <title>{overlay.name}</title>}
          </path>
        );
      })}
    </svg>
  );
}
