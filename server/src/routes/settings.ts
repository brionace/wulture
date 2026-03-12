import { Router } from "express";
import prisma from "../lib/prisma.ts";

const router = Router();

// Get all settings as key-value object
router.get("/", async (_req, res) => {
  const settings = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  for (const s of settings) {
    obj[s.key] = s.value;
  }
  res.json(obj);
});

// Upsert settings (body is { key: value, ... })
router.put("/", async (req, res) => {
  const entries = Object.entries(req.body) as [string, string][];
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );
  // Return updated settings
  const settings = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  for (const s of settings) {
    obj[s.key] = s.value;
  }
  res.json(obj);
});

export default router;
