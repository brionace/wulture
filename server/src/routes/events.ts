import { Router } from "express";
import prisma from "../lib/prisma.ts";

const router = Router();

// List all events
router.get("/", async (_req, res) => {
  const events = await prisma.timelineEvent.findMany({
    orderBy: { yearFrom: "asc" },
  });
  res.json(events);
});

// Get single event
router.get("/:id", async (req, res) => {
  const event = await prisma.timelineEvent.findUnique({
    where: { id: parseInt(req.params.id, 10) },
  });
  if (!event) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(event);
});

// Create event
router.post("/", async (req, res) => {
  const { name, from, to, yearFrom, yearTo, colour, locations, influencedBy } =
    req.body;
  const event = await prisma.timelineEvent.create({
    data: {
      name,
      from,
      to,
      yearFrom,
      yearTo,
      colour,
      locations: JSON.stringify(locations),
      influencedBy: JSON.stringify(influencedBy ?? []),
    },
  });
  res.status(201).json(event);
});

// Update event
router.put("/:id", async (req, res) => {
  const { name, from, to, yearFrom, yearTo, colour, locations, influencedBy } =
    req.body;
  const event = await prisma.timelineEvent.update({
    where: { id: parseInt(req.params.id, 10) },
    data: {
      ...(name !== undefined && { name }),
      ...(from !== undefined && { from }),
      ...(to !== undefined && { to }),
      ...(yearFrom !== undefined && { yearFrom }),
      ...(yearTo !== undefined && { yearTo }),
      ...(colour !== undefined && { colour }),
      ...(locations !== undefined && { locations: JSON.stringify(locations) }),
      ...(influencedBy !== undefined && {
        influencedBy: JSON.stringify(influencedBy),
      }),
    },
  });
  res.json(event);
});

// Delete event
router.delete("/:id", async (req, res) => {
  await prisma.timelineEvent.delete({
    where: { id: parseInt(req.params.id, 10) },
  });
  res.status(204).end();
});

export default router;
