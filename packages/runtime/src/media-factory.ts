import type { WorldState } from '@griffty/domain';

export function generateDailyWeatherGraphic(_world: WorldState, forecastData: { location: string; tempF: number; condition: string; windMph: number; lake_effect_risk: boolean }): { imagePrompt: string; caption: string; altText: string; hashtags: string[] } {
  const formattedCondition = forecastData.condition.replace(/\s+/g, '');
  return {
    imagePrompt: `Branded weather forecast card for The Weatherman. Colors: WNY/Buffalo scheme (blue, gold, white). Professional meteorologist aesthetic. Text showing ${forecastData.location}, ${forecastData.tempF}°F, ${forecastData.condition}.`,
    caption: `Today's forecast for ${forecastData.location}: Expect a high of ${forecastData.tempF}°F with ${forecastData.condition}. Wind is blowing at ${forecastData.windMph} mph.${forecastData.lake_effect_risk ? ' Be on alert for potential lake effect snow.' : ''}`,
    altText: `Weather forecast graphic for ${forecastData.location} showing ${forecastData.tempF} degrees Fahrenheit and ${forecastData.condition}.`,
    hashtags: ['#WNY', '#Buffalo', '#LakeEffect', '#DocWeather', '#TheWeatherman', `#Buffalo${formattedCondition}`]
  };
}

export function generateStormAlertCard(_world: WorldState, alert: { eventType: string; severity: 'minor' | 'moderate' | 'severe' | 'extreme'; area: string; onset: string; message: string }): { imagePrompt: string; caption: string; altText: string; urgency: 'low' | 'high' | 'critical' } {
  const urgency = (alert.severity === 'extreme' || alert.severity === 'severe') ? 'critical' : (alert.severity === 'moderate' ? 'high' : 'low');
  return {
    imagePrompt: `Urgent branded storm alert graphic for The Weatherman. High contrast, warning aesthetic. Text: ${alert.eventType}, Severity: ${alert.severity}.`,
    caption: `🚨 ALERT: ${alert.eventType} for ${alert.area} starting ${alert.onset}. ${alert.message} Stay safe!`,
    altText: `Storm alert card indicating a ${alert.severity} ${alert.eventType} for ${alert.area}.`,
    urgency
  };
}

export function generateMusicPromoContent(_world: WorldState, track: { title: string; artist: string; platforms: string[]; releaseDate: string }): { tiktokCaption: string; instagramCaption: string; xPost: string; altText: string; imagePrompt: string; hashtags: string[] } {
  const hashtags = ['#NewMusic', '#IndieArtist', '#TheWeatherman', '#WNY', '#Buffalo'];
  return {
    tiktokCaption: `Wait until the beat drops on this one 🎧 Use this sound! ${hashtags.join(' ')}`,
    instagramCaption: `The wait is over! "${track.title}" by ${track.artist} is officially out on ${track.platforms.join(', ')}. Stream it now at the link in bio! 🎶 ${hashtags.join(' ')}`,
    xPost: `NEW MUSIC DROP 🚨 "${track.title}" by ${track.artist} is out now! Stream it here: [LINK] 🎵`,
    altText: `Promotional graphic for the release of ${track.title} by ${track.artist}.`,
    imagePrompt: `Album art promotional graphic for "${track.title}" by ${track.artist}. High quality, striking aesthetic.`,
    hashtags
  };
}

export function generateFundraisingGraphic(_world: WorldState, opts: { currentAmountUsd: number; goalAmountUsd: number; platform: string; daysRemaining?: number }): { imagePrompt: string; caption: string; altText: string; progressPct: number } {
  const progressPct = Math.round((opts.currentAmountUsd / opts.goalAmountUsd) * 100);
  return {
    imagePrompt: `Clean, inspiring progress bar graphic showing ${progressPct}% of the fundraising goal reached. Incorporate The Weatherman brand colors.`,
    caption: `We're at ${progressPct}% of our goal! Thank you so much for the support. Help us cross the finish line—donate or share here: [GiveSendGo LinkPlaceholder]`,
    altText: `Fundraising progress bar showing ${progressPct}% of $${opts.goalAmountUsd} goal reached`,
    progressPct
  };
}

export function generateWeeklyExplainer(_world: WorldState, topic: { phenomenon: string; explanation: string; localRelevance: string }): { script: string; infographicPrompt: string; altText: string; duration_seconds: number } {
  const script = `Hey everyone, Doc Weather here. Let's talk about ${topic.phenomenon}. ${topic.explanation} So what does this mean for us here in WNY? ${topic.localRelevance} Stay curious, and stay prepared!`;
  const words = script.split(' ').length;
  const duration_seconds = Math.round((words / 150) * 60);
  return {
    script,
    infographicPrompt: `Educational infographic explaining ${topic.phenomenon}, showing how it impacts the WNY area.`,
    altText: `Infographic explaining ${topic.phenomenon} and its local effects.`,
    duration_seconds
  };
}

export function generateCollabPitch(_world: WorldState, target: { name: string; platform: string; followerCount: number; niche: string }): { subject: string; body: string; callToAction: string } {
  return {
    subject: `Collaboration Request: The Weatherman x ${target.name}`,
    body: `Hi ${target.name}, Doc Weather here from The Weatherman brand. I love your work in the ${target.niche} space on ${target.platform} and think our audiences would really connect. I'd love to chat about a potential collaboration that blends my WNY weather insights with your unique content. Let me know if you're open to exploring some ideas!`,
    callToAction: "Let's set up a quick 10-minute call this week."
  };
}

export function selectTodaysContent(world: WorldState): { type: string; priority: number; description: string }[] {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const content = [];
  
  if (today === 1) {
    content.push({ type: 'music_promo', priority: 100, description: 'Music Monday promotional post' });
  } else if (today === 0) {
    const hasRecentFundraiser = world.events?.some((e: any) => (e.name as string) === 'social.fundraiser_drafted');
    if (!hasRecentFundraiser) {
      content.push({ type: 'fundraiser', priority: 90, description: 'Weekly fundraising update' });
    }
  }

  content.push({ type: 'daily_weather', priority: 50, description: 'Daily forecast graphic' });
  
  return content.sort((a, b) => b.priority - a.priority);
}
