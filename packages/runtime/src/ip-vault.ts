import type { IpVault, TrackRecord } from '../../domain/src/types.js';

export function createEmptyVault(): IpVault {
  return {
    tracks: [],
    lastAuditAt: null
  };
}

export function addTrack(vault: IpVault, track: Omit<TrackRecord, 'id' | 'createdAt' | 'updatedAt'>): IpVault {
  const newTrack: TrackRecord = {
    ...track,
    id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return {
    ...vault,
    tracks: [...vault.tracks, newTrack]
  };
}

export function recordClaim(vault: IpVault, trackId: string, claim: TrackRecord['claimHistory'][0]): IpVault {
  return {
    ...vault,
    tracks: vault.tracks.map(t => {
      if (t.id === trackId) {
        return {
          ...t,
          claimHistory: [...t.claimHistory, claim],
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    })
  };
}

export function getUnprotectedTracks(vault: IpVault): TrackRecord[] {
  return vault.tracks.filter(t => !t.contentIdRegistered || t.isrc === null);
}
