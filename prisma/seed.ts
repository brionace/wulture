import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../dev.db");
const eventsDir = path.resolve(__dirname, "events");

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

interface RawEvent {
  name: string;
  from: string;
  to: string;
  yearFrom: number;
  yearTo: number;
  colour: string;
  locations: string[];
  influencedBy?: string[];
  category?: string;
  tags?: string[];
  featured?: boolean;
  link?: string;
}

function wikipediaLinkForEvent(name: string): string {
  const slug = encodeURIComponent(name.replace(/\s+/g, "_"));
  return `https://en.wikipedia.org/wiki/${slug}`;
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function loadEventsFromJson(): Promise<RawEvent[]> {
  const jsonFiles = await collectJsonFiles(eventsDir);
  const allEvents: RawEvent[] = [];

  for (const filePath of jsonFiles) {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as RawEvent[];

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected array in ${filePath}`);
    }

    allEvents.push(...parsed);
  }

  return allEvents;
}

async function main() {
  console.log("Seeding database...");

  const events = await loadEventsFromJson();

  // Clear existing data
  await prisma.timelineEvent.deleteMany();
  await prisma.setting.deleteMany();

  // Insert events
  for (const event of events) {
    await prisma.timelineEvent.create({
      data: {
        name: event.name,
        from: event.from,
        to: event.to,
        yearFrom: event.yearFrom,
        yearTo: event.yearTo,
        colour: event.colour,
        locations: JSON.stringify(event.locations ?? []),
        influencedBy: JSON.stringify(event.influencedBy ?? []),
        category: event.category ?? "",
        tags: JSON.stringify(event.tags ?? []),
        featured: Boolean(event.featured),
        link: event.link?.trim() || wikipediaLinkForEvent(event.name),
      },
    });
  }

  // Insert default settings
  await prisma.setting.createMany({
    data: [{ key: "playSpeed", value: "10" }],
  });

  console.log(`Seeded ${events.length} timeline events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
