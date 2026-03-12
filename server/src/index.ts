import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.ts";
import settingsRouter from "./routes/settings.ts";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: /localhost:\d+/ }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/events", eventsRouter);
app.use("/api/settings", settingsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
