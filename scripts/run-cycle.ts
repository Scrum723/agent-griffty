import { runCycle } from "@griffty/runtime";
import { loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();
const store = openStore();
const world = await store.load();
const result = await runCycle(world);
await store.save(result.world);
console.log(result.plan.summary);
console.log(
  JSON.stringify(
    {
      kpi: result.plan.kpi,
      decisions: result.qualifierResults.map((q) => ({
        id: q.opportunity_id,
        total: q.total,
        decision: q.decision,
        codes: q.reason_codes,
      })),
    },
    null,
    2,
  ),
);
