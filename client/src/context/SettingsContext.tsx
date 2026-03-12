import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type TimelineEventParsed,
  type TimelineEvent,
  parseEvent,
  API_URL,
} from "../types";

interface SettingsContextValue {
  events: TimelineEventParsed[];
  visibleEventIds: Set<number>;
  toggleEventVisibility: (id: number) => void;
  showInfluence: boolean;
  setShowInfluence: (v: boolean) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<TimelineEventParsed[]>([]);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showInfluence, setShowInfluence] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then((res) => res.json())
      .then((data: TimelineEvent[]) => {
        const parsed = data.map(parseEvent);
        setEvents(parsed);
        setVisibleEventIds(new Set(parsed.map((e) => e.id)));
      })
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleEventVisibility = useCallback((id: number) => {
    setVisibleEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        events,
        visibleEventIds,
        toggleEventVisibility,
        showInfluence,
        setShowInfluence,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
