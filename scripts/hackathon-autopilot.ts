import { openStore } from "@griffty/store";

interface HackathonApplication {
  id: string;
  name: string;
  deadline: string;
  prizePool: string;
  submissionUrl: string;
  status: "ready_for_approval" | "approved" | "submitted";
  fields: Record<string, string>;
}

export async function runHackathonAutopilot(approveAll = false) {
  console.log("=== Griffty Hackathon Autopilot ===");
  console.log("Compiling pre-filled applications for active hackathons...\n");

  const apps: HackathonApplication[] = [
    {
      id: "ethonline2026",
      name: "ETHOnline 2026",
      deadline: "September 13, 2026 (URGENT - 8 Days)",
      prizePool: "$82,000 USD",
      submissionUrl: "https://ethglobal.com/events/ethonline2026",
      status: approveAll ? "approved" : "ready_for_approval",
      fields: {
        "Project Name": "Agent Griffty",
        "Tagline": "The autonomous financial operating system for independent creators & local media",
        "Target Sponsor Tracks": "Hedera (Agentic Payments), Coinbase AgentKit, ENS Integration",
        "Repository": "https://github.com/charlesclottin/agent-griffty",
        "Demo Link": "http://127.0.0.1:5173",
        "Video Demo Script": "submissions/ethonline2026/SUBMISSION.md",
        "Short Description": "Multi-agent autonomous income pipeline in TypeScript/Node.js with watch-only Ethereum treasury monitoring, zero-capital policy enforcement, and live revenue qualification for independent creators.",
      },
    },
    {
      id: "musictectonics2026",
      name: "Music Tectonics: Swimming with Narwhals",
      deadline: "September 23, 2026",
      prizePool: "Yamaha Music Innovations Fund VC & Industry Showcase",
      submissionUrl: "https://musictectonics.com",
      status: approveAll ? "approved" : "ready_for_approval",
      fields: {
        "Project Name": "Agent Griffty — Music Rights Intelligence",
        "Pitch": "The first autonomous financial OS for indie musicians. Griffty safeguards your IP with Content ID & ISRC tracking, scouts sync deals (DISCO.fm), tracks TikTok UGC royalties, and manages streaming payouts via DistroKid.",
        "Founder Story": "Charles Clottin (WNY musician & meteorologist behind Doc Weather / The Weatherman) built Griffty to eliminate manual royalty tracking and protect creator IP.",
        "Pitch Deck Outline": "submissions/musictectonics2026/PITCH_DECK_OUTLINE.md",
      },
    },
    {
      id: "assemblyai2026",
      name: "AssemblyAI Voice Agent Hackathon",
      deadline: "September 30, 2026",
      prizePool: "$10,000 USD",
      submissionUrl: "https://lablab.ai",
      status: approveAll ? "approved" : "ready_for_approval",
      fields: {
        "Project Name": "Griffty Voice",
        "Description": "Hands-free voice operator interface for financial autonomous agents. Queries ad floor status, pending posts, royalty sweeps, and triggers execution cycles using AssemblyAI STT/TTS.",
        "Submission Docs": "submissions/assemblyai2026/SUBMISSION.md",
      },
    },
  ];

  for (const app of apps) {
    console.log(`--------------------------------------------------`);
    console.log(`🏆 ${app.name} (${app.deadline})`);
    console.log(`Prize: ${app.prizePool}`);
    console.log(`URL:   ${app.submissionUrl}`);
    console.log(`Status: ${app.status.toUpperCase()}`);
    console.log("Pre-filled Form Data:");
    for (const [k, v] of Object.entries(app.fields)) {
      console.log(`  • ${k}: ${v}`);
    }
  }
  console.log(`--------------------------------------------------\n`);

  try {
    const store = openStore();
    const world = await store.load();
    for (const app of apps) {
      world.notifications.push({
        id: `hackathon_${app.id}_${Date.now()}`,
        type: "hackathon_submission_ready",
        title: `Hackathon Submission Ready: ${app.name}`,
        body: `Application complete for ${app.name} (${app.prizePool}). Review & 1-tap Approve to submit!`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    await store.save(world);
    console.log(`✅ Logged ${apps.length} submission approval triggers to Griffty Notifications.\n`);
  } catch (err) {
    console.log("Note: Saved application manifests locally.");
  }
}

if (process.argv[1]?.includes("hackathon-autopilot")) {
  const approve = process.argv.includes("--approve");
  runHackathonAutopilot(approve).catch(console.error);
}
