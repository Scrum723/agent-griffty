/**
 * Sentinel — defensive layers for Griffty and other Doc agents.
 *
 * Does: honeypots, incident journal, OUR kill-switch, IP/UA logging on our hosts.
 * Does not: attack remote machines, steal third-party data, overload someone else's box.
 * Attribution is for reports to the operator / law enforcement, not counter-hacks.
 */

export type SentinelLayer = "watch" | "honeypot" | "contain" | "kill_ours";

export interface SentinelIncident {
  ts: string;
  layer: SentinelLayer;
  ip?: string;
  userAgent?: string;
  path?: string;
  note: string;
}

export interface SentinelPolicy {
  /** Frozen: never authorize outbound offensive actions. */
  allowCounterHack: false;
  honeypotPaths: string[];
  maxEventsPerIpPerMin: number;
}

export const DEFAULT_SENTINEL: SentinelPolicy = Object.freeze({
  allowCounterHack: false,
  honeypotPaths: ["/admin", "/wp-login.php", "/.env", "/debug/heap"],
  maxEventsPerIpPerMin: 60,
});

export function classifyProbe(path: string, policy: SentinelPolicy = DEFAULT_SENTINEL): SentinelLayer {
  if (policy.honeypotPaths.includes(path)) return "honeypot";
  return "watch";
}

export function shouldTripLocalKill(incidents: SentinelIncident[]): boolean {
  const recent = incidents.filter((i) => Date.now() - Date.parse(i.ts) < 60_000);
  return recent.filter((i) => i.layer === "honeypot").length >= 8;
}
