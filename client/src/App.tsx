import { TimelineProvider } from "./context/TimelineContext";
import { SettingsProvider } from "./context/SettingsContext";
import WorldMap from "./components/WorldMap";
import TimelineScrobbler from "./components/TimelineScrobbler";
import SettingsPanel from "./components/SettingsPanel";
import Legend from "./components/Legend";
import EventDetailsPanel from "./components/EventDetailsPanel";

export default function App() {
  return (
    <SettingsProvider>
      <TimelineProvider>
        <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
          {/* Full-viewport map */}
          <WorldMap />

          {/* Floating UI overlays */}
          <Legend />
          <EventDetailsPanel />
          <SettingsPanel />
          <TimelineScrobbler />
        </div>
      </TimelineProvider>
    </SettingsProvider>
  );
}
