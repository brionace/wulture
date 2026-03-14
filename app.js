// app.js — Plesk/Passenger entry point
// Dynamic import avoids top-level await, which Passenger's require() cannot handle
import("./server/src/index.ts").catch((err) => {
  console.error(err);
  process.exit(1);
});
