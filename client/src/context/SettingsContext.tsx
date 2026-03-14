import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
  filteredEvents: TimelineEventParsed[];
  visibleEventIds: Set<number>;
  toggleEventVisibility: (id: number) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedTags: Set<string>;
  toggleTag: (tag: string) => void;
  showOnlyFeatured: boolean;
  setShowOnlyFeatured: (value: boolean) => void;
  toggleFeatured: (id: number) => Promise<void>;
  showInfluence: boolean;
  setShowInfluence: (v: boolean) => void;
  mapProjection: "flat" | "rounded";
  setMapProjection: (value: "flat" | "rounded") => void;
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
  const [mapProjection, setMapProjection] = useState<"flat" | "rounded">(
    "flat",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(true);

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

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesName =
        query.length === 0 || event.name.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory.length === 0 || event.category === selectedCategory;
      const matchesTags =
        selectedTags.size === 0 ||
        [...selectedTags].every((tag) => event.tagsNames.includes(tag));
      const matchesFeatured = !showOnlyFeatured || event.featured;

      return matchesName && matchesCategory && matchesTags && matchesFeatured;
    });
  }, [events, searchTerm, selectedCategory, selectedTags, showOnlyFeatured]);

  const toggleFeatured = useCallback(
    async (id: number) => {
      const target = events.find((e) => e.id === id);
      if (!target) return;

      try {
        const response = await fetch(`${API_URL}/api/events/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: !target.featured }),
        });

        if (!response.ok) {
          throw new Error(`Failed to toggle featured for event ${id}`);
        }

        const updated: TimelineEvent = await response.json();
        const parsed = parseEvent(updated);
        setEvents((prev) => prev.map((e) => (e.id === id ? parsed : e)));
      } catch (err) {
        console.error(err);
      }
    },
    [events],
  );

  return (
    <SettingsContext.Provider
      value={{
        events,
        filteredEvents,
        visibleEventIds,
        toggleEventVisibility,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedTags,
        toggleTag,
        showOnlyFeatured,
        setShowOnlyFeatured,
        toggleFeatured,
        showInfluence,
        setShowInfluence,
        mapProjection,
        setMapProjection,
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
