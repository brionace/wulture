import { useRef, useEffect, useState, useMemo } from "react";
import {
  geoCentroid,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
  geoGraticule,
} from "d3-geo";
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
  const [rotation, setRotation] = useState<[number, number, number]>([
    0, -15, 0,
  ]);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    x: number;
    y: number;
    t: number;
  } | null>(null);
  const autoResumeAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const { currentYear, activeEvent } = useTimeline();
  const {
    events,
    filteredEvents,
    visibleEventIds,
    showInfluence,
    mapProjection,
  } = useSettings();

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
    const mapHeight = dimensions.height - 80;
    const proj =
      mapProjection === "rounded"
        ? geoOrthographic()
            .fitSize([dimensions.width, mapHeight], { type: "Sphere" } as any)
            .clipAngle(90)
            .rotate(rotation)
        : geoNaturalEarth1().fitSize([dimensions.width, mapHeight], {
            type: "Sphere",
          } as any);
    const pg = geoPath(proj);
    return { projection: proj, pathGenerator: pg };
  }, [dimensions, mapProjection, rotation]);

  const countryCenters = useMemo(() => {
    const centers = new Map<string, [number, number]>();
    if (!worldData) return centers;

    for (const country of worldData.features as CountryFeature[]) {
      const alpha3 = numericIdToAlpha3(country.id);
      if (!alpha3) continue;
      const [lon, lat] = geoCentroid(country);
      centers.set(alpha3, [lon, lat]);
    }

    return centers;
  }, [worldData]);

  const targetRotation = useMemo<[number, number, number] | null>(() => {
    if (mapProjection !== "rounded" || !activeEvent) return null;

    const coords = activeEvent.locationCodes
      .map((code) => countryCenters.get(code))
      .filter((v): v is [number, number] => Boolean(v));

    if (coords.length === 0) return null;

    let x = 0;
    let y = 0;
    let z = 0;

    for (const [lon, lat] of coords) {
      const lonRad = (lon * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;
      x += Math.cos(latRad) * Math.cos(lonRad);
      y += Math.cos(latRad) * Math.sin(lonRad);
      z += Math.sin(latRad);
    }

    const centerLon = (Math.atan2(y, x) * 180) / Math.PI;
    const centerLat =
      (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;

    return [-centerLon, -centerLat, 0];
  }, [mapProjection, activeEvent, countryCenters]);

  // Auto-rotate rounded map toward active event center.
  useEffect(() => {
    if (mapProjection !== "rounded") {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let last = performance.now();

    const normalizeLonDelta = (from: number, to: number) => {
      let delta = to - from;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      return delta;
    };

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const drag = dragStateRef.current;
      const canAutoRotate = !drag?.active && now >= autoResumeAtRef.current;

      if (canAutoRotate && targetRotation) {
        setRotation((prev) => {
          const lonDelta = normalizeLonDelta(prev[0], targetRotation[0]);
          const latDelta = targetRotation[1] - prev[1];

          const stiffness = Math.min(8 * dt, 1);
          const nextLon = ((prev[0] + lonDelta * stiffness + 180) % 360) - 180;
          const nextLat = Math.max(-80, Math.min(80, prev[1] + latDelta * stiffness));

          return [nextLon, nextLat, 0];
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mapProjection, targetRotation]);

  const handlePointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (mapProjection !== "rounded") return;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
    };
    autoResumeAtRef.current = performance.now() + 1200;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (mapProjection !== "rounded") return;
    const drag = dragStateRef.current;
    if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;

    const now = performance.now();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;

    const lonDelta = dx * 0.35;
    const latDelta = -dy * 0.2;

    setRotation((prev) => {
      const lon = ((prev[0] + lonDelta + 180) % 360) - 180;
      const lat = Math.max(-80, Math.min(80, prev[1] + latDelta));
      return [lon, lat, prev[2]];
    });

    dragStateRef.current = {
      ...drag,
      x: e.clientX,
      y: e.clientY,
      t: now,
    };

    autoResumeAtRef.current = now + 1200;
  };

  const handlePointerUp: React.PointerEventHandler<SVGSVGElement> = (e) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    autoResumeAtRef.current = performance.now() + 800;
  };

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
      className={`bg-gray-950 ${mapProjection === "rounded" ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={mapProjection === "rounded" ? { touchAction: "none" } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
