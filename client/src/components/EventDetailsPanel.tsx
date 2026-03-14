import { useMemo, useState } from "react";
import { useTimeline } from "../context/TimelineContext";

function isWikipediaLink(link: string): boolean {
  if (!link) return false;

  try {
    const parsed = new URL(link);
    if (parsed.protocol !== "https:") return false;

    return (
      parsed.hostname === "wikipedia.org" ||
      parsed.hostname.endsWith(".wikipedia.org")
    );
  } catch {
    return false;
  }
}

function EventDetailsContent({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { activeEvent } = useTimeline();

  const safeLink = useMemo(() => {
    const candidate = activeEvent?.link?.trim() ?? "";
    return isWikipediaLink(candidate) ? candidate : "";
  }, [activeEvent]);

  const title = activeEvent ? activeEvent.name : "No active event";

  return (
    <>
      <div className="flex items-start justify-between gap-2 border-b border-gray-700/60 px-3 py-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gray-400">
            Event Wiki
          </div>
          <div className="text-sm text-gray-100 font-medium leading-tight">
            {title}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          title={collapsed ? "Expand panel" : "Collapse panel"}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.9a.75.75 0 111.08 1.04l-4.25 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1">
          {safeLink ? (
            <iframe
              key={safeLink}
              src={safeLink}
              title={`Wikipedia article for ${activeEvent?.name ?? "event"}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">
              {activeEvent
                ? "No Wikipedia link available for this event yet."
                : "No event is active at the current timeline year."}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function EventDetailsPanel() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`fixed right-4 top-16 z-30 hidden w-96 overflow-hidden rounded-xl border border-gray-700/60 bg-gray-900/90 shadow-2xl backdrop-blur-sm md:flex md:flex-col ${
          collapsed ? "h-16" : "bottom-20"
        }`}
      >
        <EventDetailsContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </aside>

      <aside
        className={`fixed bottom-20 left-2 right-2 z-30 flex flex-col overflow-hidden rounded-xl border border-gray-700/60 bg-gray-900/95 shadow-2xl backdrop-blur-sm md:hidden ${
          collapsed ? "h-16" : "h-72"
        }`}
      >
        <EventDetailsContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </aside>
    </>
  );
}
