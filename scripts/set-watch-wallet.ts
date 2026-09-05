import { loadDotEnv, openStore, upsertWatchWallet } from "@griffty/store";
import type { WalletRole } from "@griffty/domain";

loadDotEnv();
const role = (process.argv.find((a) => a.startsWith("--role="))?.slice(7) ?? "burner") as WalletRole;
const address = process.argv.find((a) => a.startsWith("--address="))?.slice(10);
const chain = process.argv.find((a) => a.startsWith("--chain="))?.slice(8) ?? "solana";
if (!address) {
  console.error("Usage: tsx scripts/set-watch-wallet.ts --role=burner --address=So1anaAddr --chain=solana");
  process.exit(1);
}
const store = openStore();
const world = await store.load();
const wallet = upsertWatchWallet(world, { role, address, chain });
await store.save(world);
console.log(JSON.stringify({ saved: wallet, store: store.kind }, null, 2));
