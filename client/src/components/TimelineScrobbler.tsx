import { useMemo } from "react";
import { useTimeline } from "../context/TimelineContext";

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(Math.round(year))} BC`;
  return `${Math.round(year)} AD`;
}

function buildTicks(minYear: number, maxYear: number) {
  const steps = 4;
  const range = maxYear - minYear;

  return Array.from({ length: steps + 1 }, (_, index) => {
    const year = Math.round(minYear + (range * index) / steps);
    return {
      key: `${index}-${year}`,
      year,
    };
  });
}

export default function TimelineScrobbler() {
  const {
    currentYear,
    setCurrentYear,
    isPlaying,
    togglePlay,
    playSpeed,
    setPlaySpeed,
    minYear,
    maxYear,
  } = useTimeline();

  const ticks = useMemo(() => buildTicks(minYear, maxYear), [minYear, maxYear]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-900/55 px-3 py-2 shadow-[0_-8px_32px_rgba(0,0,0,0.3)] sm:gap-4">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-300/25 bg-indigo-600 text-white transition-colors hover:bg-indigo-500"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" rx="1" />
              <rect x="12" y="4" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <polygon points="6,4 16,10 6,16" />
            </svg>
          )}
        </button>

        <div className="hidden shrink-0 rounded-full border border-gray-600 bg-gray-800 px-3 py-1 font-mono text-sm text-gray-100 sm:inline-flex">
          {formatYear(currentYear)}
        </div>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-gray-700 via-indigo-400/40 to-gray-700" />
          <div className="pointer-events-none absolute inset-x-1 top-1/2 hidden -translate-y-1/2 items-center justify-between md:flex">
            {ticks.map((tick) => (
              <span key={tick.key} className="h-2.5 w-px bg-gray-500/80" />
            ))}
          </div>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent accent-indigo-500"
            aria-label="Timeline year"
          />
          <div className="hidden items-center justify-between text-[11px] text-gray-400 md:flex">
            {ticks.map((tick) => (
              <span key={tick.key}>{formatYear(tick.year)}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
            Speed
          </span>
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            aria-label="Playback speed"
          >
            <option value={1}>1x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
            <option value={25}>25x</option>
            <option value={50}>50x</option>
            <option value={100}>100x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
