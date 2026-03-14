import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useTimeline } from "../context/TimelineContext";

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
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
  } = useSettings();
  const { playSpeed, setPlaySpeed } = useTimeline();

  const categories = Array.from(
    new Set(events.map((event) => event.category).filter(Boolean)),
  ).sort();

  const tags = Array.from(
    new Set(events.flatMap((event) => event.tagsNames)),
  ).sort();

  return (
    <>
      {/* Gear icon button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center border border-gray-600/50"
        title="Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
          {/* Playback speed */}
          <div className="mb-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">
              Playback Speed
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className="flex-1 h-2 accent-indigo-500"
                aria-label="Playback speed"
              />
              <span className="text-gray-400 text-sm w-14 text-right">
                {playSpeed} yr/s
              </span>
            </div>
          </div>

          {/* Show Influence toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showInfluence}
                onChange={(e) => setShowInfluence(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-gray-300 text-sm font-medium">
                Show Influence Zones
              </span>
            </label>
            <p className="text-gray-500 text-xs mt-1 ml-7">
              Highlight territories of influencing empires with lower opacity
            </p>
          </div>

          {/* Search and filtering */}
          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-gray-300 text-sm font-medium mb-2">Search</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by event name"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <h3 className="text-gray-300 text-sm font-medium mb-2">
                Category
              </h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-gray-300 text-sm font-medium mb-2">Tags</h3>
              <div className="max-h-28 overflow-y-auto rounded-md border border-gray-800 bg-gray-800/60 p-2 space-y-1">
                {tags.length === 0 && (
                  <div className="text-xs text-gray-500">No tags available</div>
                )}
                {tags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 text-xs text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.has(tag)}
                      onChange={() => toggleTag(tag)}
                      className="w-3.5 h-3.5 rounded accent-indigo-500"
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyFeatured}
                onChange={(e) => setShowOnlyFeatured(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-gray-300 text-sm font-medium">
                Show only featured events
              </span>
            </label>
            <p className="text-gray-500 text-xs ml-7">
              Enabled by default on load to reduce map noise.
            </p>
          </div>

          {/* Event visibility toggles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 text-sm font-medium">Events</h3>
              <span className="text-xs text-gray-500">
                {filteredEvents.length} / {events.length}
              </span>
            </div>
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleEventIds.has(event.id)}
                    onChange={() => toggleEventVisibility(event.id)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: event.colour }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-200 text-sm truncate flex items-center gap-2">
                      {event.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void toggleFeatured(event.id);
                        }}
                        className="text-xs leading-none"
                        title={
                          event.featured ? "Unfeature event" : "Feature event"
                        }
                      >
                        {event.featured ? "★" : "☆"}
                      </button>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {event.from} – {event.to}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {event.category}
                    </div>
                    {event.tagsNames.length > 0 && (
                      <div className="text-gray-600 text-xs">
                        Tags: {event.tagsNames.join(", ")}
                      </div>
                    )}
                    {event.influencedByNames.length > 0 && (
                      <div className="text-gray-600 text-xs italic">
                        Influenced by: {event.influencedByNames.join(", ")}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
