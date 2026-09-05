import { loadDotEnv, openStore, upsertWatchWallet } from "@griffty/store";

loadDotEnv();
const store = openStore();
const world = await store.load();

const saved = [
  upsertWatchWallet(world, {
    id: "wal_session",
    role: "session",
    address: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z",
    chain: "solana",
  }),
  upsertWatchWallet(world, {
    id: "wal_burner",
    role: "burner",
    address: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z",
    chain: "solana",
  }),
  upsertWatchWallet(world, {
    id: "wal_eth",
    role: "treasury",
    address: "0x4d2cf207fdb93a183f959533ce1081f696a5f191",
    chain: "ethereum",
  }),
  upsertWatchWallet(world, {
    id: "wal_btc",
    role: "treasury",
    address: "bc1q457dstu7ehk2k6eku6t3f7x8kkm2yur6wanydl",
    chain: "bitcoin",
  }),
];

world.wallets = world.wallets.filter((w) => w.address !== "pending");
await store.save(world);
console.log(
  JSON.stringify(
    {
      store: store.kind,
      watchOnly: saved.every((w) => w.watchOnly === true),
      wallets: saved.map((w) => ({ id: w.id, role: w.role, chain: w.chain, address: w.address })),
    },
    null,
    2,
  ),
);
