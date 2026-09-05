import { describe, expect, it } from 'vitest';
import { emptyWorld } from '@griffty/store';
import { draftPost, autoReplyDm, publishWeeklyFundraiser } from './social-agent.js';

describe('social-agent', () => {
  it('draftPost throws ACCESSIBILITY_VIOLATION when image has no alt text', () => {
    const world = emptyWorld();
    expect(() => {
      draftPost(world, {
        platform: 'x',
        text: 'Hello',
        mediaUrls: ['https://example.com/img.jpg'],
        altText: []
      });
    }).toThrow(/ACCESSIBILITY_VIOLATION/);
  });

  it('autoReplyDm returns donation URL when message contains "donate"', () => {
    const world = emptyWorld();
    const reply = autoReplyDm(world, {
      platform: 'x',
      inboundMessage: 'I want to donate to the channel',
      senderId: 'user1'
    });
    expect(reply).toContain('givesendgo.com');
  });

  it('publishWeeklyFundraiser creates one draft per platform with notification', () => {
    const world = emptyWorld();
    const drafts = publishWeeklyFundraiser(world, { general: 'https://givesendgo.com/test' });
    
    expect(drafts.length).toBe(5);
    expect(world.socialPosts.length).toBe(5);
    expect(world.notifications.length).toBe(5);
    expect(drafts.map(d => d.platform).sort()).toEqual(['facebook', 'instagram', 'tiktok', 'x', 'youtube'].sort());
  });
});
