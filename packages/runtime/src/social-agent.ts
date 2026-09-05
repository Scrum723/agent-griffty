import type { WorldState, SocialPostRecord, NotificationRecord } from '@griffty/domain';
import { newId } from '@griffty/domain';

export function draftPost(
  world: WorldState,
  opts: {
    platform: SocialPostRecord['platform'];
    text: string;
    mediaUrls?: string[];
    altText?: string[];
    opportunityId?: string;
    scheduledAt?: string;
    captionsAttached?: boolean;
  }
): SocialPostRecord {
  if (opts.mediaUrls && opts.mediaUrls.length > 0) {
    if (!opts.altText || opts.altText.length < opts.mediaUrls.length) {
      throw new Error('ACCESSIBILITY_VIOLATION: every image requires alt text');
    }
  }

  let note = '';
  const hasVideo = opts.mediaUrls?.some(url => url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'));
  if (hasVideo && !opts.captionsAttached) {
    note = ' [wcagLevel: null - captions missing]';
  }

  const postId = newId('post');
  const post: SocialPostRecord = {
    id: postId,
    platform: opts.platform,
    status: 'draft',
    content: opts.text + note,
    mediaUrls: opts.mediaUrls || [],
    altText: opts.altText ? opts.altText.join(' | ') : '',
    captions: opts.captionsAttached ? 'attached' : '',
    scheduledAt: opts.scheduledAt,
  };

  world.socialPosts.push(post);

  const notification: NotificationRecord = {
    id: newId('notif'),
    type: 'post_approval_required',
    title: 'Post Approval Required',
    body: `${opts.platform}: ${opts.text.substring(0, 80)}... [Post ID: ${postId}]`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  // Note: expiration handling isn't explicitly in the schema, just add to body or ignore if not strict
  world.notifications.push(notification);

  return post;
}

export function autoReplyDm(
  world: WorldState,
  opts: { platform: SocialPostRecord['platform']; inboundMessage: string; senderId: string }
): string {
  const msg = opts.inboundMessage.toLowerCase();
  let reply = 'Thanks for reaching out! We will get back to you soon.';

  if (msg.includes('donate') || msg.includes('support')) {
    reply = 'Thank you for your support! You can donate here: https://www.givesendgo.com/theweatherman';
  } else if (msg.includes('weather') || msg.includes('forecast')) {
    reply = 'Check out the latest forecast at Doc Weather: https://docweather.com';
  } else if (msg.includes('music') || msg.includes('song')) {
    reply = 'Listen to our latest tracks here: https://open.spotify.com/';
  }

  const notification: NotificationRecord = {
    id: newId('notif'),
    type: 'dm_reply_pending',
    title: 'Pending DM Reply',
    body: `Reply to ${opts.senderId} on ${opts.platform}: ${reply}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  world.notifications.push(notification);

  return reply;
}

export function autoAcceptFollowRequest(
  world: WorldState,
  platform: SocialPostRecord['platform']
): { platform: string; accepted: boolean; reason: string } {
  const notification: NotificationRecord = {
    id: newId('notif'),
    type: 'follow_accepted',
    title: 'Follow Request Accepted',
    body: `Auto-accepted follow request on ${platform}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  world.notifications.push(notification);

  world.events.push({
    id: newId('evt'),
    name: 'social.follow_accepted' as any,
    ts: new Date().toISOString(),
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: { platform },
  });

  return { platform, accepted: true, reason: 'auto-accept enabled' };
}

export function publishWeeklyFundraiser(
  world: WorldState,
  donationUrls: Record<string, string>
): SocialPostRecord[] {
  const drafted: SocialPostRecord[] = [];
  const platforms = ['x', 'tiktok', 'facebook', 'instagram', 'youtube'];
  
  const url = donationUrls['givesendgo'] || donationUrls['general'];

  for (const platform of platforms) {
    let text = '';
    let mediaUrls: string[] | undefined = undefined;
    let altText: string[] | undefined = undefined;

    if (platform === 'x') {
      text = `Help us keep the weather updates coming! Donate here: ${url} #WNY #DocWeather #TheWeatherman`.substring(0, 280);
    } else if (platform === 'tiktok') {
      text = `Support the channel! ${url} #WNY #DocWeather #TheWeatherman #Weather #Update`;
    } else if (platform === 'facebook') {
      text = `We appreciate all the support from our community. If you'd like to help us continue providing daily weather updates and more, please consider donating. Every little bit helps! ${url}`;
    } else if (platform === 'instagram') {
      text = `Link in bio to support! #WNY #DocWeather #TheWeatherman`;
      mediaUrls = ['https://example.com/fundraiser.jpg'];
      altText = ['Fundraiser image'];
    } else if (platform === 'youtube') {
      text = `Community update: We are running a fundraiser to keep the channel going strong. Support us here: ${url}`;
    }

    const post = draftPost(world, { platform, text, mediaUrls, altText });
    drafted.push(post);
  }

  return drafted;
}

export function updateBio(
  world: WorldState,
  platform: SocialPostRecord['platform'],
  _newBio: string,
  _changeReason: string
): NotificationRecord {
  const notification: NotificationRecord = {
    id: newId('notif'),
    type: 'bio_updated',
    title: 'Bio Updated',
    body: `Bio updated on ${platform}: ${_newBio}, reason: ${_changeReason}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  world.notifications.push(notification);

  world.events.push({
    id: newId('evt'),
    name: 'social.bio_updated' as any,
    ts: new Date().toISOString(),
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: { platform },
  });

  return notification;
}

export function growthReport(
  world: WorldState
): { platform: string; weeklyTarget: number; postsThisWeek: number; draftsApproved: number; draftsRejected: number }[] {
  const stats = new Map<string, any>();

  for (const post of world.socialPosts) {
    if (!stats.has(post.platform)) {
      stats.set(post.platform, { platform: post.platform, weeklyTarget: 1000, postsThisWeek: 0, draftsApproved: 0, draftsRejected: 0 });
    }
    const platStats = stats.get(post.platform);
    
    // Simplistic counting just to return some stats
    if (post.status === 'draft') platStats.postsThisWeek++;
    else if (post.status === 'published') {
      platStats.postsThisWeek++;
      platStats.draftsApproved++;
    } else if (post.status === 'rejected') {
      platStats.draftsRejected++;
    }
  }

  return Array.from(stats.values());
}
