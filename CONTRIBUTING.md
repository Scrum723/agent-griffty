# Contributing to Agent Griffty

Thank you for your interest! Griffty is an autonomous income OS for independent creators.

## How to Add a New Income Connector

Every new connector follows a 6-step pattern:

1. **Add feature flag** in `packages/connectors/src/flags.ts`:
   ```typescript
   myPlatform: bool('CONNECTOR_MY_PLATFORM'),
   ```

2. **Add mock listing** in `packages/connectors/src/mock.ts`:
   ```typescript
   { external_id: 'myplatform_daily', source: 'myplatform', source_class: 'depin_node', ... }
   ```

3. **Add live stub** in `packages/connectors/src/live.ts`:
   ```typescript
   if (flags.myPlatform) out.push(...await readOfficialStatus('myplatform', 'https://myplatform.com/api'));
   ```

4. **Add golden fixture** in `packages/scoring/src/fixtures.ts` with documented score band.

5. **Add test** in `packages/scoring/src/score.test.ts` verifying score band + decision.

6. **Add platform record** in `.griffty/state.json` under `platforms[]`.

## Running Tests

```bash
npm test          # all tests
npm run typecheck # TypeScript only
npm run cycle     # run one cycle
npm run seed      # reset + reseed state
```

## Policy

- Official HTTPS endpoints only. No scraping of authenticated walls.
- Zero incremental capital. `requiresDeposit: true` = automatic rejection.
- Human gate on: KYC, wallet signatures, ads budget increases, media post approvals.
- No private keys, seed phrases, or credentials in state, logs, or Firestore.
