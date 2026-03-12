import { useTimeline } from "../context/TimelineContext";

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(Math.round(year))} BC`;
  return `${Math.round(year)} AD`;
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700/50 px-6 py-3">
      <div className="flex items-center gap-4 max-w-7xl mx-auto">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" rx="1" />
              <rect x="12" y="4" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <polygon points="6,4 16,10 6,16" />
            </svg>
          )}
        </button>

        {/* Current year display */}
        <div className="text-white font-mono text-sm w-24 text-center shrink-0">
          {formatYear(currentYear)}
        </div>

        {/* Timeline slider */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-gray-500 text-xs shrink-0">
            {formatYear(minYear)}
          </span>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="flex-1 h-2 accent-indigo-500 cursor-pointer"
            aria-label="Timeline year"
          />
          <span className="text-gray-500 text-xs shrink-0">
            {formatYear(maxYear)}
          </span>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-gray-400 text-xs">Speed</label>
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600"
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
