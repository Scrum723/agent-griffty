# AWS "Agents for Humans" Hackathon 2026 — Devpost Submission

**Challenge**: AWS Agents for Humans Hackathon  
**Devpost URL**: https://agentsforhumans.devpost.com/  
**Target Track**: **Professional Agents** (Makers, Creators, Solo Business Owners)  
**Submission Deadline**: September 14, 2026 at 8:00 PM EDT  
**Prize Pool**: $40,000 Cash ($10,000 Grand Prize, $5,000 Track 1st Place)  

---

## 1. Quick Info & Metadata

- **Project Name**: Agent Griffty — The Autonomous Income & Operations OS for Independent Creators
- **Tagline**: The first autonomous agent OS that discovers revenue opportunities, drafts platform-native media, defends intellectual property, and safeguards capital for solo creators.
- **Repository**: [https://github.com/charlesclottin/agent-griffty](https://github.com/charlesclottin/agent-griffty) (MIT License)
- **Live Cloud Run Demo**: [https://agent-griffty-rekidpbsea-uc.a.run.app](https://agent-griffty-rekidpbsea-uc.a.run.app)
- **Primary Agent Framework**: **AWS `@strands-agents/sdk`**
- **Author / Operator**: Charles Clottin (Doc Weather / The Weatherman) — Independent Creator & Meteorologist (Western New York)

---

## 2. Devpost Submission Questionnaire

### Project Description (Elevator Pitch & Overview)
Independent creators, artists, and solo entrepreneurs are overwhelmed. A modern creative career requires juggling dozens of disparate operational surfaces: scouting brand sponsorships, applying for arts and journalism grants, monitoring streaming royalties, distributing daily content across social channels, screening academic panel studies, evaluating affiliate partnerships, and protecting against copyright infringement. Solo operators either burn out or spend 80% of their time on admin work instead of producing creative work.

**Agent Griffty** is an autonomous financial and operational operating system powered by the **AWS `@strands-agents/sdk`**. Griffty acts as a tireless, mathematically disciplined business manager for solo creators:
1. **Autonomous Revenue Pipeline**: Discovers and ranks opportunities across 7 distinct income classes (owned media, grant funding, streaming royalties, panel research, DePIN bandwidth, affiliate marketing, and sync licensing).
2. **Deterministic Risk & Compliance Engine**: Enforces a strict Zero-Capital policy ($100 treasury floor) and rejects predatory contracts, fake checks, phishing grants, and upfront fee scams before human attention is wasted.
3. **AWS Strands Multi-Tool Architecture**: Dispatches specialized function tools via `@strands-agents/sdk` to scout listings, evaluate token marks, coordinate Human-in-the-Loop gating, and generate branded social and grant proposals.
4. **Original Media Factory & Social Agent**: Drafts platform-native weather cards, storm alerts, and music release campaigns with automated WCAG 2.1 AA accessibility auditing (alt text & closed captions).
5. **IP Vault & Rights Defense**: Audits music catalogs (ISRC, PRO work registrations with BMI/ASCAP), detects copyright claims, and automates DMCA takedown dispute generation.

---

### What It Does & Key Features

- **Strands Autonomous Agent Loop**: Built on `@strands-agents/sdk` `Agent`, utilizing 6 custom `FunctionTool` definitions:
  - `scout_opportunities`: Multi-vertical opportunity discovery across connectors.
  - `qualify_and_score`: Deterministic rubric scoring (fit, net yields, risk inverse, payout reliability).
  - `check_treasury_floor`: Enforces zero-capital constraints and reserves minimum operating cash.
  - `human_gate_intervene`: Flags actions requiring human authorization (sync licensing, crypto movements, public social posting).
  - `generate_branded_media`: Composes WCAG-compliant media and copy drafts.
  - `grant_intelligence`: Matches creators to non-dilutive arts, climate, and tech grants.
- **Human-in-the-Loop (HITL) Safeguards**: High-impact actions—grant submissions, DM replies, crypto transactions, and public social releases—never fire autonomously. They are queued into an operator review gate accessible via web dashboard, Telegram, SMS, or Electron desktop notifications.
- **Production Hybrid Cloud Deployment**: Runs continuously via Google Cloud Run and Cloud Scheduler (15-minute heartbeat cycles) backed by Firestore persistence, with a companion native macOS Electron desktop console.

---

### How We Built It (Technical Architecture)

Griffty is architected as a clean TypeScript monorepo with separation of concerns:

```
agent-griffty/
├── packages/
│   ├── domain/       # Shared pure types, reason codes, and state contracts
│   ├── scoring/      # Deterministic 100-point multi-vertical opportunity scoring rubric
│   ├── connectors/   # Scouts for YouTube, DistroKid, Prolific, Grass, Amazon, Grants
│   ├── runtime/      # Core execution orchestrator, IP Vault, Media Factory, 
│   │                 # and AWS @strands-agents/sdk integration (strands-agent.ts)
│   └── store/        # Persistence adapters (Local State JSON & Cloud Firestore)
├── apps/
│   ├── server/       # Hono HTTP API running on Cloud Run
│   ├── dashboard/    # Accessible React operator dashboard (WCAG 2.1 AA)
│   └── electron/     # Native macOS desktop console with tray notifications
└── scripts/          # Cloud deployment & automated cycle execution
```

#### AWS Strands Integration Details:
- **Framework**: `@strands-agents/sdk` v0.1.x
- **Module**: `packages/runtime/src/strands-agent.ts`
- **Pattern**: Griffty instantiates a root `Agent` instance configured with Strands tools. Each tool wraps an isolated domain capability with explicit JSON Schema parameter validation, returning structured JSON payloads back into the agent context for continuous cycle progression.

---

### Challenges We Ran Into

1. **Hallucination vs. Capital Safety**: Early LLM prompts would occasionally recommend speculative actions or miss scam disclosures. We solved this by pairing the Strands Agent framework with a **deterministic scoring rubric** (`@griffty/scoring`). If an opportunity has an upfront investment requirement or failed KYC platform flags, it is rejected by strict mathematical rules before the LLM can overrule it.
2. **Creator Privacy Lockdown**: As an open-source project, balancing real creator data (e.g. Doc Weather's 95-track BMI catalog and streaming telemetry) with public repository distribution was critical. We engineered an isolated `.griffty/` vault layer that is strictly git-ignored, substituting public templates for open distribution.
3. **Accessibility Compliance in Agentic Media**: Automated social posting agents often neglect digital accessibility. We made WCAG 2.1 AA compliance a hard gate: Griffty's `media-factory` and `social-agent` fail validation if an image prompt lacks descriptive alternative text.

---

### Accomplishments That We're Proud Of

- **Fully Functional End-to-End Autonomous Pipeline**: A single heartbeat cycle successfully queries live market feeds, scores 20+ opportunities across 7 sectors, updates treasury allocations, drafts social content, and notifies the human operator in under 2 seconds.
- **Zero-Capital Enforcement**: We proved that autonomous agents can drive tangible income for solo operators without needing large capital reserves or risk exposure.
- **Enterprise-Grade Architecture**: 10 test suites, 37 passing unit/integration tests, zero TypeScript errors, and zero Docker build warnings.

---

### What We Learned

- Working with the new `@strands-agents/sdk` highlighted the power of decoupled function tools for agentic reasoning. By giving the Strands agent discrete, well-typed domain tools (`check_treasury_floor`, `qualify_and_score`), multi-step operational logic becomes predictable and robust.
- Multi-agent collaboration works best with clear hierarchical boundaries: an autonomous discovery agent must be subordinate to a deterministic risk gate, which in turn must be subordinate to a human gate.

---

### What's Next for Agent Griffty

- **AWS Bedrock Model Integration**: Native inference integration with Amazon Nova and Anthropic Claude 3.5 Sonnet on AWS Bedrock for advanced grant proposal drafting.
- **Expanded Connector Ecosystem**: Direct API adapters for Substack, Bandcamp, TikTok Creator Marketplace, and Upwork Enterprise grants.
- **Multi-Tenant Open Distribution**: Packaging Griffty as a one-click AWS ECS/App Runner deployment template for any creator to deploy their own personal financial agent.

---

## 3. Video Demo Script (3 Minutes — Presentation Guide)

**Presenter**: Charles Clottin  
**Tone**: Confident, authentic, practitioner-focused, concise.

- **0:00 - 0:35 — The Problem**:  
  *"Hi, I'm Charles Clottin. I'm a meteorologist running Doc Weather in Western New York, and an independent musician. Like millions of creators and solo business owners, I spend more time managing logistics than creating. Between scouting journalism grants, tracking streaming royalties on 95 tracks, pitching sponsors, and scheduling posts, solo operations are overwhelming. Meet Agent Griffty."*

- **0:35 - 1:15 — What Griffty Is & Architecture**:  
  *"Griffty is an autonomous income and operations OS built with AWS's `@strands-agents/sdk`. It runs 24/7 on Cloud Run, monitoring 7 distinct income verticals. Here is the architecture: the Strands Agent coordinates specialized function tools that scout listings, score yields, enforce a strict Zero-Capital floor, draft compliant media, and manage human approvals."*

- **1:15 - 2:05 — Live Walkthrough (Screen Share)**:  
  *"Let's look at the live dashboard. Griffty just finished an autonomous cycle. Notice the Queue: it evaluated 15 opportunities. It instantly hard-rejected a $1,500 fake grant scam because of an upfront fee requirement. Meanwhile, it surfaced a $25,000 Next Challenge for Local News grant, matched my profile, and drafted a qualification dossier. Over in the IP Vault, it monitors my registered tracks against Content ID claims. In the Social tab, it drafted our weekly weather fundraiser with verified WCAG alt text ready for my 1-click approval."*

- **2:05 - 2:40 — Strands Agents SDK in Action**:  
  *(Show terminal / code snippet)*:  
  *"Here is our Strands agent implementation in `packages/runtime/src/strands-agent.ts`. Using the new `@strands-agents/sdk`, Griffty defines typed `FunctionTool` instances with JSON schemas. When an autonomous cycle executes, the Strands agent orchestrates discovery, checks our treasury constraints, and triggers human intervention when critical thresholds are crossed."*

- **2:40 - 3:00 — Conclusion & The Vision**:  
  *"Griffty gives independent creators the operational leverage of a full corporate management team, completely open-source and human-aligned. Thank you to AWS and Devpost for organizing the Agents for Humans hackathon!"*

---

## 4. Submission Checklist

- [x] Integrate AWS `@strands-agents/sdk` (`packages/runtime/src/strands-agent.ts`)
- [x] Verify test suite passing (37 tests across 10 test suites)
- [x] Ensure 0 PII, personal phone, email, or private catalog credentials in git
- [x] Deploy live instance on Google Cloud Run (`https://agent-griffty-rekidpbsea-uc.a.run.app`)
- [x] Record 3-minute screen recording using the script above
- [x] Upload video to YouTube (Unlisted or Public) and copy link to Devpost
- [x] Submit entry on [https://agentsforhumans.devpost.com/](https://agentsforhumans.devpost.com/) before **Sept 14, 2026 8:00 PM EDT**
- [ ] *(Optional Bonus)* Publish 500-word build summary on `builder.aws.com`
