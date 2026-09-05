# Agent Griffty — Architecture

```mermaid
flowchart TB
  subgraph Sources
    APIs[Official APIs and dashboards]
    Official[Project domains and verified accounts]
    Nodes[DePIN / bandwidth / weather station]
    Owned[X TikTok YT Shopify Substack]
  end

  subgraph Agents
    Orch[Orchestrator]
    Scout[Scout]
    Qual[Qualifier]
    Exec[Executor]
    Treas[Treasury]
    Ads[Ads Ops]
    Risk[Risk and Compliance]
    Cr[Creative Factory]
  end

  subgraph Firebase
    FS[(Firestore)]
    FN[Cloud Functions + Scheduler]
    SM[Secret Manager]
    Ev[events collection]
  end

  subgraph ExternalSpend
    GAds[Google Ads]
    MAds[Meta Ads]
    TAds[TikTok Ads]
    XAds[X Ads]
    Shop[Shopify]
  end

  subgraph Custody
    HW[Hardware or cold treasury wallet]
    Burn[Burner wallets]
    Op[Operator approval channel]
  end

  APIs --> Scout
  Official --> Scout
  Nodes --> Scout
  Owned --> Scout
  Scout --> Orch
  Orch --> Qual
  Qual --> Risk
  Risk --> Exec
  Exec --> Treas
  Treas --> Ads
  Cr --> Ads
  Orch --> FS
  Scout --> Ev
  Qual --> Ev
  Treas --> Ev
  Ads --> Ev
  FN --> Orch
  Treas -->|watch-only| HW
  Treas -->|watch-only| Burn
  Exec -->|human gate| Op
  Ads --> GAds
  Ads --> MAds
  Ads --> TAds
  Ads --> XAds
  Ads --> Shop
  SM --> FN
```

Runtime loop (default 15 minutes): snapshot world state → Orchestrator plan → dispatch → persist events → update dashboard.

Trust boundary: API tokens stay in Secret Manager / env. The browser dashboard is read-mostly. Wallet private keys never enter the store.

## Local vs Firebase

| Mode | Store | How |
|---|---|---|
| Default local | `.griffty/state.json` | `npm run dev:server` |
| Firebase emulator | Firestore | `firebase emulators:start --config infra/firebase.json` once CLI is installed |

Live connectors remain feature-flagged off until an official enrolled session exists.
