import { Router } from "express";
import prisma from "../lib/prisma.ts";

const router = Router();

function normalizeLink(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function isWikipediaLink(link: string): boolean {
  if (!link) return true;

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
  const {
    name,
    from,
    to,
    yearFrom,
    yearTo,
    colour,
    locations,
    influencedBy,
    category,
    tags,
    featured,
    link,
  } = req.body;

  const normalizedLink = normalizeLink(link);
  if (!isWikipediaLink(normalizedLink)) {
    res.status(400).json({ error: "link must be an https wikipedia.org URL" });
    return;
  }

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
      category: category ?? "",
      tags: JSON.stringify(tags ?? []),
      featured: Boolean(featured),
      link: normalizedLink,
    },
  });
  res.status(201).json(event);
});

// Update event
router.put("/:id", async (req, res) => {
  const {
    name,
    from,
    to,
    yearFrom,
    yearTo,
    colour,
    locations,
    influencedBy,
    category,
    tags,
    featured,
    link,
  } = req.body;

  if (link !== undefined) {
    const normalizedLink = normalizeLink(link);
    if (!isWikipediaLink(normalizedLink)) {
      res
        .status(400)
        .json({ error: "link must be an https wikipedia.org URL" });
      return;
    }
  }

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
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(link !== undefined && { link: normalizeLink(link) }),
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
