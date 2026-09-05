import type { ScoutOpportunityInput } from "@griffty/domain";

export async function socialScout(): Promise<ScoutOpportunityInput[]> {
  const opps: ScoutOpportunityInput[] = [];

  // YouTube OAuth
  if (process.env.GOOGLE_CLIENT_YOUTUBE_ID) {
    opps.push({
      external_id: "youtube_channel_monetization_live",
      source: "youtube",
      source_class: "owned_media_monetize",
      title: "YouTube Channel Monetization (The Weatherman / Doc Weather)",
      url: "https://studio.youtube.com",
      compensation_text: "$15-$45/month estimated ad share & subscriber rev",
      compensation_estimate_usd: 15,
      compensation_asset: "USD",
      time_estimate_minutes: 0,
      incremental_minutes: 0,
      deadline_at: null,
      enrolled_platform: true,
      documented_rate: true,
      p_payout: 0.95,
      established_payout_history: true,
      kyc_already_complete: true,
      requires_deposit: false,
      requires_wallet: false,
      official_url_verified: true,
      kyc_required: false,
      geo_eligibility: ["US"],
      raw_notes: "Live channel integration",
      confidence: 0.95,
    });
  }

  // X (Twitter)
  if (process.env.X_ACCESS_TOKEN) {
    opps.push({
      external_id: "x_creator_revenue_live",
      source: "x",
      source_class: "owned_media_monetize",
      title: "X Creator Ad Revenue Sharing (@TheWeathermanWNY)",
      url: "https://x.com/i/monetization",
      compensation_text: "$10-$30/month estimated ad revenue share",
      compensation_estimate_usd: 10,
      compensation_asset: "USD",
      time_estimate_minutes: 0,
      incremental_minutes: 0,
      deadline_at: null,
      enrolled_platform: true,
      documented_rate: true,
      p_payout: 0.9,
      established_payout_history: true,
      kyc_already_complete: true,
      requires_deposit: false,
      requires_wallet: false,
      official_url_verified: true,
      kyc_required: false,
      geo_eligibility: ["US"],
      raw_notes: "Live channel integration",
      confidence: 0.95,
    });
  }

  // TikTok LIVE & Creator
  if (process.env.TIKTOK_CLIENT_KEY) {
    opps.push({
      external_id: "tiktok_creator_portal_live",
      source: "tiktok",
      source_class: "owned_media_monetize",
      title: "TikTok LIVE Gifts & Creator Rewards",
      url: "https://www.tiktok.com/creator-portal",
      compensation_text: "$20-$50/month estimated creator rewards",
      compensation_estimate_usd: 20,
      compensation_asset: "USD",
      time_estimate_minutes: 0,
      incremental_minutes: 0,
      deadline_at: null,
      enrolled_platform: true,
      documented_rate: true,
      p_payout: 0.9,
      established_payout_history: true,
      kyc_already_complete: true,
      requires_deposit: false,
      requires_wallet: false,
      official_url_verified: true,
      kyc_required: false,
      geo_eligibility: ["US"],
      raw_notes: "Live channel integration",
      confidence: 0.95,
    });
  }

  // Meta (Instagram & Facebook Pages)
  if (process.env.META_THEWEATHERMAN_ACCESS_TOKEN || process.env.META_FACEBOOK_ACCESS_TOKEN) {
    opps.push({
      external_id: "meta_stars_and_reels_live",
      source: "meta",
      source_class: "owned_media_monetize",
      title: "Meta Stars & Performance Bonus (The Weatherman / Weatherworldcc)",
      url: "https://business.facebook.com/creatorstudio",
      compensation_text: "$15-$40/month estimated stars & bonuses",
      compensation_estimate_usd: 15,
      compensation_asset: "USD",
      time_estimate_minutes: 0,
      incremental_minutes: 0,
      deadline_at: null,
      enrolled_platform: true,
      documented_rate: true,
      p_payout: 0.9,
      established_payout_history: true,
      kyc_already_complete: true,
      requires_deposit: false,
      requires_wallet: false,
      official_url_verified: true,
      kyc_required: false,
      geo_eligibility: ["US"],
      raw_notes: "Live channel integration",
      confidence: 0.95,
    });
  }

  return opps;
}

