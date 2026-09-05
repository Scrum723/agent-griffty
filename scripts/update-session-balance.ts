import { loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();
const store = openStore();
const world = await store.load();
const w = world.wallets.find((x) => x.id === "wal_session");
if (!w) throw new Error("no session wallet");
w.assets = [
  { symbol: "SOL", amount: 0.02509724, usdMark: 2.6 },
  { symbol: "JitoSOL", amount: 0.0461805, usdMark: 6.21 },
];
w.lastPolledAt = new Date().toISOString();
world.updatedAt = w.lastPolledAt;
await store.save(world);
console.log(JSON.stringify({ address: w.address, assets: w.assets, store: store.kind }));
