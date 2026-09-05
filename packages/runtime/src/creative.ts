import { newId, type Creative, type WorldState } from "@griffty/domain";

export function draftCreatives(world: WorldState): Creative[] {
  if (world.creatives.length > 0) return world.creatives;
  const drafts: Creative[] = [
    {
      id: newId("cr"),
      platform: "tiktok",
      format: "9:16",
      hook: "Lake-effect band just flipped onshore.",
      body: "What Buffalo sees in the next 3 hours, in one map.",
      cta: "Follow for the next band update",
      hypothesis: "Specific local threat in first second lifts 3s hold.",
      status: "draft",
      metrics: {},
    },
    {
      id: newId("cr"),
      platform: "meta",
      format: "4:5",
      hook: "This is why the snow is heavier south of the city.",
      body: "Fetch-and-band primer with a labeled still of the radar.",
      cta: "Watch the 5-day",
      hypothesis: "Practical value + labeled proof beats generic storm b-roll.",
      status: "draft",
      metrics: {},
    },
    {
      id: newId("cr"),
      platform: "x",
      format: "16:9",
      hook: "Thread: what actually changes overnight.",
      body: "Temperature, wind, and lake-effect risk in four posts.",
      cta: "Bookmark the thread",
      hypothesis: "Utility threads outperform vibe posts on X for weather.",
      status: "draft",
      metrics: {},
    },
  ];
  return drafts;
}
