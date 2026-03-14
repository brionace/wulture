import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSettings } from "./SettingsContext";
import type { TimelineEventParsed } from "../types";

interface TimelineContextValue {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  playSpeed: number; // years per second
  setPlaySpeed: (speed: number) => void;
  minYear: number;
  maxYear: number;
  activeEvent: TimelineEventParsed | null;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

const DEFAULT_MIN_YEAR = -500;
const DEFAULT_MAX_YEAR = new Date().getFullYear();

export function TimelineProvider({ children }: { children: ReactNode }) {
  const { events, filteredEvents, visibleEventIds } = useSettings();
  const timelineEvents = filteredEvents.length > 0 ? filteredEvents : events;
  const minYear = useMemo(
    () => timelineEvents[0]?.yearFrom ?? DEFAULT_MIN_YEAR,
    [timelineEvents],
  );
  const maxYear = useMemo(
    () =>
      timelineEvents.reduce(
        (latest, event) => Math.max(latest, event.yearTo),
        DEFAULT_MAX_YEAR,
      ),
    [timelineEvents],
  );
  const [currentYear, setCurrentYear] = useState(DEFAULT_MIN_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(10);
  const lastFrameTime = useRef<number | null>(null);
  const animRef = useRef<number>(0);

  const activeEvent = useMemo(
    () =>
      timelineEvents.find(
        (event) =>
          visibleEventIds.has(event.id) &&
          currentYear >= event.yearFrom &&
          currentYear <= event.yearTo,
      ) ?? null,
    [timelineEvents, visibleEventIds, currentYear],
  );

  useEffect(() => {
    setCurrentYear((prev) => {
      if (prev < minYear) return minYear;
      if (prev > maxYear) return maxYear;
      return prev;
    });
  }, [minYear, maxYear]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTime.current = null;
      cancelAnimationFrame(animRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameTime.current !== null) {
        const delta = (timestamp - lastFrameTime.current) / 1000; // seconds
        setCurrentYear((prev) => {
          const next = prev + delta * playSpeed;
          if (next >= maxYear) {
            setIsPlaying(false);
            return maxYear;
          }
          return next;
        });
      }
      lastFrameTime.current = timestamp;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, playSpeed, maxYear]);

  return (
    <TimelineContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        isPlaying,
        togglePlay,
        playSpeed,
        setPlaySpeed,
        minYear,
        maxYear,
        activeEvent,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within TimelineProvider");
  return ctx;
}
