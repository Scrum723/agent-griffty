import type { Campaign, WorldState } from "@griffty/domain";

export interface FundraiserAdPack {
  campaigns: Campaign[];
  keywords: string[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
    callToAction: string;
  };
  recommendations: {
    googleAdGrantsEligible: boolean;
    suggestedDailyBudgetUsd: number;
    pauseThresholdUsd: number;
    strategyNotes: string;
  };
}

/**
 * Dictates Google Ads campaign configurations specifically optimized for GiveSendGo & GoFundMe fundraisers.
 */
export function buildFundraiserGoogleAds(world: WorldState): FundraiserAdPack {
  const gsgUrl = process.env.GIVESENDGO_URL || "https://www.givesendgo.com/graduate-r-d-and-creator-bridging-the-ga";
  const gfmUrl = process.env.GOFUNDME_URL || "https://www.gofundme.com/f/help-charles-bridge-the-gap-j8uh2";

  const campaigns: Campaign[] = [
    {
      id: "camp_google_gsg_rd",
      platform: "google",
      name: `GiveSendGo — Graduate R&D (${gsgUrl})`,
      objective: "leads",
      kind: "prospecting",
      dailyBudgetUsd: 2.50, // Micro-budget to protect zero-capital policy
      status: "proposed",
      utm: {
        source: "google",
        medium: "cpc",
        campaign: "gsg_graduate_rd",
        content: "search_v1",
      },
      kpis: { roas: null, cpa_usd: null, cpm: null, ctr: null },
      creativeIds: [],
    },
    {
      id: "camp_google_gfm_community",
      platform: "google",
      name: `GoFundMe — Bridge The Gap (${gfmUrl})`,
      objective: "leads",
      kind: "prospecting",
      dailyBudgetUsd: 2.50,
      status: "proposed",
      utm: {
        source: "google",
        medium: "cpc",
        campaign: "gfm_bridge_gap",
        content: "search_v1",
      },
      kpis: { roas: null, cpa_usd: null, cpm: null, ctr: null },
      creativeIds: [],
    },
  ];

  const keywords = [
    "independent scientific research donation",
    "support local weather forecasting WNY",
    "graduate research gap funding",
    "doc weather community fund",
    "support independent creator tech",
    "the weatherman WNY donation",
    "creator community support fund",
    "open source weather engineering donation",
  ];

  const adCopy = {
    headlines: [
      "Support Graduate R&D & Creators",
      "Help Charles Bridge The Gap",
      "Doc Weather & Research Fund",
      "Independent Weather & Tech R&D",
      "GiveSendGo Creator Support",
    ],
    descriptions: [
      "Help fund independent meteorological and open-source software R&D. Every dollar directly advances the mission.",
      "Support community-first weather forecasting and innovative tech development. Read our story and donate today.",
      "Direct crowdfunding on GiveSendGo and GoFundMe to bridge crucial graduate research gaps.",
    ],
    callToAction: "Donate Now & Share the Mission",
  };

  const recommendations = {
    googleAdGrantsEligible: true,
    suggestedDailyBudgetUsd: 2.50,
    pauseThresholdUsd: world.policy.adsFloorUsd || 100,
    strategyNotes: 
      "1. Google Ad Grants: 501(c)(3) fiscal sponsors qualify for up to $10,000/month in free Google Search ads.\n" +
      "2. Zero-Capital Guard: Griffty pauses campaigns automatically if total ads balance is at or below $100.\n" +
      "3. Organic Amplification: Social agent cross-promotes to X, TikTok & Instagram with $0 marginal ad spend.",
  };

  return {
    campaigns,
    keywords,
    adCopy,
    recommendations,
  };
}
