import type { Wallet, WalletRole, WorldState } from "@griffty/domain";

const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const BTC_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
const XRPL_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function detectChain(address: string): "solana" | "ethereum" | "bitcoin" | "xrpl" {
  const trimmed = address.trim();
  if (EVM_RE.test(trimmed)) return "ethereum";
  if (BTC_RE.test(trimmed)) return "bitcoin";
  if (XRPL_RE.test(trimmed)) return "xrpl";
  if (SOLANA_RE.test(trimmed)) return "solana";
  throw new Error("Unrecognized public address.");
}

export function assertPublicWatchAddress(address: string): void {
  const trimmed = address.trim();
  const words = trimmed.split(/\s+/);
  if (words.length >= 12) {
    throw new Error("That looks like a recovery phrase. Send only the public address.");
  }
  if (/^[0-9a-f]{64}$/i.test(trimmed) || (trimmed.startsWith("0x") && trimmed.length > 42)) {
    throw new Error("That looks like a private key. Send only the public address.");
  }
  detectChain(trimmed);
}

export function upsertWatchWallet(
  world: WorldState,
  args: { id?: string; role: WalletRole; address: string; chain: string },
): Wallet {
  assertPublicWatchAddress(args.address);
  const id =
    args.id ??
    (args.role === "treasury" ? "wal_treasury" : args.role === "session" ? "wal_session" : "wal_burner");
  const next: Wallet = {
    id,
    role: args.role,
    address: args.address.trim(),
    chain: args.chain,
    watchOnly: true,
    assets: world.wallets.find((w) => w.id === id)?.assets ?? [],
    lastPolledAt: new Date().toISOString(),
  };
  const others = world.wallets.filter((w) => w.id !== id);
  world.wallets = [...others, next];
  world.updatedAt = next.lastPolledAt;
  return next;
}
