// Shared types for the Wulture app

export interface TimelineEvent {
  id: number;
  name: string;
  from: string;
  to: string;
  yearFrom: number;
  yearTo: number;
  colour: string;
  locations: string; // JSON array of ISO alpha-3 country codes
  influencedBy: string; // JSON array of event names
  category: string;
  tags: string; // JSON array of tag names
  featured: boolean;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEventParsed extends Omit<
  TimelineEvent,
  "locations" | "influencedBy" | "tags"
> {
  locationCodes: string[];
  influencedByNames: string[];
  tagsNames: string[];
}

export function parseEvent(event: TimelineEvent): TimelineEventParsed {
  return {
    ...event,
    link: event.link || "",
    locationCodes: JSON.parse(event.locations) as string[],
    influencedByNames: JSON.parse(event.influencedBy) as string[],
    tagsNames: JSON.parse(event.tags || "[]") as string[],
  };
}

export const API_URL = import.meta.env.VITE_API_URL || "";
