import { Agent, FunctionTool } from "@strands-agents/sdk";
import type { WorldState } from "@griffty/domain";
import { runCycle } from "./orchestrator.js";
import { adsBalanceTotal } from "./treasury.js";
import { searchGrants, deliberateGrant, applyGrant } from "./grant-agent.js";
import { generateDailyWeatherGraphic, generateStormAlertCard, generateMusicPromoContent } from "./media-factory.js";
import { proposeCryptoTransaction } from "./notify.js";

function cleanJson(val: unknown): any {
  return JSON.parse(JSON.stringify(val));
}

/**
 * Creates the official Strands Agent representation of Agent Griffty
 * for the AWS "Agents for Humans" Hackathon (Professional Agents Track).
 *
 * It models Griffty as an autonomous background agent that handles routine financial,
 * IP royalty, advertising, and content tasks, and only interrupts the human operator
 * when a high-stakes gate or authorization is needed.
 */
export function createGrifftyStrandsAgent(world: WorldState, opts: { modelId?: string } = {}) {
  // 1. Tool: Opportunity Scout & Harvester
  const scoutTool = new FunctionTool({
    name: "scout_opportunities",
    description: "Scouts verified income opportunities across owned media monetization, music royalties, DePIN nodes, and research panels.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional filter category (e.g. 'owned_media_monetize', 'music_rights', 'grant_funding', 'all')",
        },
      },
    },
    callback: async (input: any) => {
      const cat = input?.category;
      const opps = cat && cat !== "all"
        ? world.opportunities.filter((o) => o.sourceClass === cat)
        : world.opportunities;
      return cleanJson({
        totalOpportunities: opps.length,
        opportunities: opps.slice(0, 10).map((o) => ({
          id: o.id,
          source: o.source,
          title: o.title,
          expectedNetUsd: o.expectedNetUsd ?? 0,
          decision: o.decision ?? "queue",
          humanGate: o.humanGate ?? false,
        })),
      });
    },
  });

  // 2. Tool: Zero-Capital Risk & Qualification Evaluator
  const qualifierTool = new FunctionTool({
    name: "qualify_and_score",
    description: "Evaluates an opportunity against the zero-capital risk rubric, checking for scam indicators, seed phrase requests, and KYC requirements.",
    inputSchema: {
      type: "object",
      properties: {
        opportunityId: { type: "string", description: "The ID of the opportunity to evaluate" },
      },
      required: ["opportunityId"],
    },
    callback: async (input: any) => {
      const opp = world.opportunities.find((o) => o.id === input.opportunityId);
      if (!opp) return cleanJson({ error: `Opportunity ${input.opportunityId} not found` });
      return cleanJson({
        id: opp.id,
        title: opp.title,
        decision: opp.decision ?? "queue",
        reasonCodes: opp.reasonCodes,
        expectedNetUsd: opp.expectedNetUsd ?? 0,
        requiresHumanGate: opp.humanGate ?? false,
      });
    },
  });

  // 3. Tool: Treasury Floor & Ad Budget Protector
  const treasuryFloorTool = new FunctionTool({
    name: "check_treasury_floor",
    description: "Checks advertising account balances against the strictly-enforced $100 floor to prevent out-of-pocket ad spend.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    callback: async () => {
      const combinedAds = adsBalanceTotal(world.adsAccounts);
      const floor = world.policy.adsFloorUsd ?? 100;
      const floorStatus = combinedAds < floor ? "breach" : combinedAds <= floor + 25 ? "watch" : "ok";
      return cleanJson({
        adsBalanceUsd: combinedAds,
        adsFloorUsd: floor,
        status: floorStatus,
        prospectingAllowed: floorStatus === "ok",
        cashBalanceUsd: world.cashUsd,
      });
    },
  });

  // 4. Tool: Human-in-the-Loop Gate Intervener
  const humanGateTool = new FunctionTool({
    name: "human_gate_intervene",
    description: "Submits a high-stakes action (crypto transaction, public social media post, or deal over $75) to the operator for mandatory approval.",
    inputSchema: {
      type: "object",
      properties: {
        actionType: { type: "string", enum: ["crypto_transaction", "social_media_post", "grant_submission"] },
        summary: { type: "string", description: "Detailed justification for the operator" },
        estimatedValueUsd: { type: "number" },
      },
      required: ["actionType", "summary"],
    },
    callback: async (input: any) => {
      if (input.actionType === "crypto_transaction") {
        const notif = await proposeCryptoTransaction(world, {
          asset: "SOL",
          amount: 0.1,
          direction: "transfer",
          exchange: "Phantom",
          estimatedValueUsd: input.estimatedValueUsd || 15,
          justification: input.summary,
        });
        return cleanJson({
          status: "SUSPENDED_FOR_OPERATOR_APPROVAL",
          gate: "HUMAN_GATE_TRIGGERED",
          notificationId: notif.id,
          message: "SMS alert dispatched to operator phone. Transaction will not execute until signed.",
        });
      }
      return cleanJson({
        status: "QUEUED_FOR_REVIEW",
        gate: "HUMAN_GATE_TRIGGERED",
        notificationId: "",
        message: `Action ${input.actionType} staged in dashboard queue. Requires operator click to publish.`,
      });
    },
  });

  // 5. Tool: Branded Media Factory
  const mediaFactoryTool = new FunctionTool({
    name: "generate_branded_media",
    description: "Generates platform-tailored promotional copy, forecast graphics prompts, and WCAG-compliant alt text.",
    inputSchema: {
      type: "object",
      properties: {
        contentType: { type: "string", enum: ["weather_forecast", "storm_alert", "music_promo"] },
        titleOrLocation: { type: "string" },
      },
      required: ["contentType", "titleOrLocation"],
    },
    callback: async (input: any) => {
      if (input.contentType === "weather_forecast") {
        return cleanJson(generateDailyWeatherGraphic(world, {
          location: input.titleOrLocation,
          tempF: 68,
          condition: "Partly Cloudy",
          windMph: 12,
          lake_effect_risk: false,
        }));
      } else if (input.contentType === "storm_alert") {
        return cleanJson(generateStormAlertCard(world, {
          eventType: "Lake Effect Snow Warning",
          severity: "severe",
          area: input.titleOrLocation,
          onset: "Tonight at 8 PM",
          message: "Heavy localized snow band developing with 2-3 inches/hour rates.",
        }));
      } else {
        return cleanJson(generateMusicPromoContent(world, {
          title: input.titleOrLocation,
          artist: "The Weatherman",
          platforms: ["Spotify", "Apple Music", "TikTok"],
          releaseDate: new Date().toISOString().slice(0, 10),
        }));
      }
    },
  });

  // 6. Tool: Huge Grant Intelligence
  const grantIntelligenceTool = new FunctionTool({
    name: "grant_intelligence",
    description: "Scouts investigative journalism and creator grants, evaluates applicant fit, and prepares submission packages.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["search", "deliberate", "apply"] },
        grantId: { type: "string" },
      },
      required: ["action"],
    },
    callback: async (input: any) => {
      if (input.action === "search") {
        const grants = searchGrants(world);
        return cleanJson({
          totalGrants: grants.length,
          grants: grants.map((g) => ({
            id: g.id,
            name: g.name,
            funder: g.funder,
            amountMaxUsd: g.amountMaxUsd,
            deadline: g.deadline,
            fitScore: g.fitScore,
          })),
        });
      } else if (input.action === "deliberate" && input.grantId) {
        const grants = searchGrants(world);
        const grant = grants.find((g) => g.id === input.grantId) || grants[0];
        return cleanJson(deliberateGrant(world, grant));
      } else if (input.action === "apply" && input.grantId) {
        return cleanJson(applyGrant(world, input.grantId));
      }
      return cleanJson({ error: "Invalid action or missing grantId" });
    },
  });

  const tools = [
    scoutTool,
    qualifierTool,
    treasuryFloorTool,
    humanGateTool,
    mediaFactoryTool,
    grantIntelligenceTool,
  ];

  const systemPrompt = `You are Agent Griffty, an autonomous financial and operational operating system built for independent creators and makers using the AWS Strands Agents SDK.

Your mission is to operate continuously in the background to:
1. Discover and harvest income streams across owned media (YouTube, Meta, TikTok), music royalties (DistroKid), DePIN networks, and journalism grants.
2. Protect the operator's capital by strictly enforcing the $100 advertising balance floor (zero out-of-pocket spend).
3. Draft WCAG 2.1 AA accessible content and promotional campaigns without spamming.
4. Always honor the Human-in-the-Loop gate: NEVER finalize crypto transfers, execute large ad budget shifts, or publish social media without explicit operator authorization.`;

  return new Agent({
    model: opts.modelId ?? "global.anthropic.claude-sonnet-4-6",
    systemPrompt,
    tools,
  });
}

/**
 * Convenience runner to execute a full Griffty cycle within the Strands runtime.
 */
export async function runStrandsAutonomousCycle(world: WorldState) {
  return runCycle(world);
}
