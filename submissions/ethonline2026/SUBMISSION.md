# Agent Griffty
**Tagline:** The autonomous financial operating system for independent creators

## Description
Agent Griffty is a production-grade autonomous agent designed for independent creators to discover, qualify, and execute on zero-capital opportunities, routing those yields directly into a treasury to fund paid distribution (ads) for their owned media. 

In the Web3 ecosystem, maintaining security and operational efficiency is paramount. Griffty solves this through a robust Ethereum wallet monitoring system (watch-only treasury + burner wallets). It enforces a strict zero-capital policy for new opportunities and utilizes advanced risk and compliance filtering to automatically hard-reject scam codes, seed phrase requests, and unofficial claims. 

For airdrops and Web3 yield, Griffty shines by acting as a highly intelligent assistant: it queues verified airdrop opportunities only after checking authenticity against official URLs, and strictly mandates a human gate (operator signature) using a burner wallet for execution. It also continuously monitors token mark-to-market valuations to ensure accurate treasury tracking. Crucially, Griffty operates on a principle of absolute security: **no private keys are ever stored** in the system. The agent builds an autonomous income pipeline while respecting strict boundaries and requiring explicit human approval for sensitive Web3 transactions.

## Tech Stack
- TypeScript/Node.js monorepo
- Firebase/Firestore
- Hono API
- React dashboard
- xAI Grok LLM
- Ethereum wallet integration (watch-only)

## Target Sponsor Tracks

### 1. Hedera AI & Agentic Payments
Griffty demonstrates the potential of agentic payments by autonomously discovering yield and routing it into a centralized treasury. With Hedera, Griffty could establish a high-throughput, low-fee payment channel for micro-harvest routing directly into creator ads accounts.

### 2. Coinbase AgentKit Wallet Automation
Griffty's core capability is wallet monitoring and automated transaction queuing. Integrating Coinbase AgentKit would allow Griffty to seamlessly and securely queue authenticated transactions for the operator's burner wallet, drastically reducing the friction of claiming verified Web3 yields.

### 3. ENS Best ENS Integration for AI Agents
Griffty tracks creator treasuries using raw hex addresses. Integrating ENS allows Griffty to humanize treasury monitoring and reporting, attaching easily readable ENS names to both the primary watch-only treasury and the operational burner wallets used for claims.

## Architecture
Griffty uses a cyclical snapshot-and-plan architecture.

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
    HW[Treasury Wallet / ENS (Watch-only)]
    Burn[Burner Wallets (Watch-only)]
    Op[Operator approval channel / Signer]
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
  Treas -->|monitor mark-to-market| HW
  Treas -->|monitor yield| Burn
  Exec -->|human gate for verified airdrops| Op
  Ads --> GAds
  Ads --> MAds
  Ads --> TAds
  Ads --> XAds
  Ads --> Shop
  SM --> FN
```

## Demo Video Script
*(Narrator: Charles Clottin)*

"Hey ETHOnline. I'm Charles, and this is Agent Griffty, the autonomous financial OS for independent creators."

*(Screen: Griffty dashboard showing system overview and current treasury)*

"Griffty's job is simple: find zero-capital yield across the web and Web3, safely collect it, and use it to buy ads for our content. Let's run a cycle."

*(Screen: Terminal showing `npm run cycle`, Orchestrator logs flowing)*

"Griffty just scouted a new token claim. But watch this—the URL doesn't match the official project domain. The Risk agent catches it and hard-rejects the scam immediately. It also found a verified airdrop. Because it passed risk checks, it's queued for my approval."

*(Screen: Operator console showing queued airdrop, prompting for burner wallet signature)*

"I approve it using my burner wallet. Griffty never touches my private keys. Now let's look at the treasury."

*(Screen: ETH wallet monitoring dashboard, token mark-to-market values)*

"Griffty continuously monitors our watch-only Ethereum treasury. When the floor hits $100, the Ads Ops agent kicks in and starts funding our marketing campaigns, fully automated."

*(Screen: Closing logo)*

"Next up, we're building out a social agent and a music rights module. Thanks for watching."

## ETHOnline Specific Extensions Built
- **ENS integration:** Implemented ENS name resolution for the treasury wallet to make dashboard reporting human-readable.
- **Hedera Payment Channel:** Prototyped a Hedera-based payment channel concept for high-speed, low-fee routing of micro-harvests into the ads pipeline.

## Team
- Charles Clottin (Solo Developer)
- Doc Weather / The Weatherman (WNY)

## Links
- **Live Demo:** `https://griffty-demo.web.app`
- **GitHub Repo:** `https://github.com/charlesclottin/agent-griffty`

## Submission Checklist
- [ ] Record and edit 2-4 minute demo video
- [ ] Deploy live demo to Firebase Hosting
- [ ] Make GitHub repo public and push latest commits
- [ ] Submit application via ETHOnline portal before Sept 13
