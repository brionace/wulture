import { useTimeline } from "../context/TimelineContext";
import { useSettings } from "../context/SettingsContext";

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(Math.round(year))} BC`;
  return `${Math.round(year)} AD`;
}

export default function Legend() {
  const { currentYear } = useTimeline();
  const { filteredEvents, visibleEventIds } = useSettings();

  const activeEvents = filteredEvents.filter(
    (e) =>
      visibleEventIds.has(e.id) &&
      currentYear >= e.yearFrom &&
      currentYear <= e.yearTo,
  );

  if (activeEvents.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-40 bg-gray-900/85 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 max-w-xs">
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        Active at {formatYear(currentYear)}
      </div>
      <div className="space-y-1.5">
        {activeEvents.map((event) => (
          <div key={event.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: event.colour }}
            />
            <span className="text-gray-200 text-sm truncate">{event.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
