import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

interface TimelineContextValue {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  playSpeed: number; // years per second
  setPlaySpeed: (speed: number) => void;
  minYear: number;
  maxYear: number;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

const MIN_YEAR = -500;
const MAX_YEAR = 2025;

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState(MIN_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(10);
  const lastFrameTime = useRef<number | null>(null);
  const animRef = useRef<number>(0);

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
          if (next >= MAX_YEAR) {
            setIsPlaying(false);
            return MAX_YEAR;
          }
          return next;
        });
      }
      lastFrameTime.current = timestamp;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, playSpeed]);

  return (
    <TimelineContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        isPlaying,
        togglePlay,
        playSpeed,
        setPlaySpeed,
        minYear: MIN_YEAR,
        maxYear: MAX_YEAR,
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
