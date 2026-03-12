import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import eventsRouter from "./routes/events.ts";
import settingsRouter from "./routes/settings.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: /localhost:\d+/ }));
app.use(express.json());

// API routes
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/events", eventsRouter);
app.use("/api/settings", settingsRouter);

// Serve built client in production
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
