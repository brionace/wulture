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

function getDeepLinkState(): {
  searchTerm: string;
  selectedCategory: string;
  selectedTags: Set<string>;
  showOnlyFeatured: boolean;
  showInfluence: boolean;
  mapProjection: "flat" | "rounded";
} {
  if (typeof window === "undefined") {
    return {
      searchTerm: "",
      selectedCategory: "",
      selectedTags: new Set<string>(),
      showOnlyFeatured: true,
      showInfluence: false,
      mapProjection: "flat" as "flat" | "rounded",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const tagsParam = params.get("tags")?.trim() ?? "";
  const selectedTags = new Set(
    tagsParam
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  );

  const projection = params.get("projection");

  return {
    searchTerm: params.get("q")?.trim() ?? "",
    selectedCategory: params.get("category")?.trim() ?? "",
    selectedTags,
    showOnlyFeatured: params.get("featured") !== "0",
    showInfluence: params.get("influence") === "1",
    mapProjection: projection === "rounded" ? "rounded" : "flat",
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const deepLinkState = useMemo(getDeepLinkState, []);
  const [events, setEvents] = useState<TimelineEventParsed[]>([]);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showInfluence, setShowInfluence] = useState(
    deepLinkState.showInfluence,
  );
  const [mapProjection, setMapProjection] = useState<"flat" | "rounded">(
    deepLinkState.mapProjection,
  );
  const [searchTerm, setSearchTerm] = useState(deepLinkState.searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(
    deepLinkState.selectedCategory,
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    deepLinkState.selectedTags,
  );
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(
    deepLinkState.showOnlyFeatured,
  );

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const query = searchTerm.trim();
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    if (selectedTags.size > 0) {
      params.set("tags", Array.from(selectedTags).sort().join(","));
    } else {
      params.delete("tags");
    }

    if (!showOnlyFeatured) {
      params.set("featured", "0");
    } else {
      params.delete("featured");
    }

    if (showInfluence) {
      params.set("influence", "1");
    } else {
      params.delete("influence");
    }

    if (mapProjection === "rounded") {
      params.set("projection", "rounded");
    } else {
      params.delete("projection");
    }

    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
  }, [
    searchTerm,
    selectedCategory,
    selectedTags,
    showOnlyFeatured,
    showInfluence,
    mapProjection,
  ]);

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
