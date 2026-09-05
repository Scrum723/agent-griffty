# Changelog

All notable changes to Agent Griffty are documented here.

## [1.0.0] — 2026-09-05

### Added

**Income Verticals**
- `owned_media_monetize` — YouTube ad revenue, TikTok LIVE gifts, Spotify for Podcasters, Facebook Stars
- `panel_research` — UserTesting, Prolific Academic, dscout diary missions
- `depin_node` — Grass.io and Nodepay residential bandwidth nodes
- `affiliate` — Amazon Associates storm-prep gear, SaaS weather app referral
- `music_rights` — DistroKid streaming royalties, YouTube Content ID, DISCO.fm sync licensing, TikTok Sound UGC

**Agents**
- Social Agent (9th agent) — DM auto-reply, follow-request acceptance, weekly fundraising drafts, bio optimization
- Media Factory — original branded content for The Weatherman (weather graphics, storm alerts, music promos)

**The Weatherman Brand**
- Profile setup kits for 12 platforms under The Weatherman brand
- IP Protection strategy: Content ID, ISRC audit, BMI PRO registration, DMCA templates
- IP Vault — track catalog with claim history and protection status

**Infrastructure**
- Electron desktop app (macOS .dmg, Windows .exe, Linux .AppImage)
- System tray icon with native notifications for post approvals and alerts
- Docker + Docker Compose for self-hosted deployment
- `griffty` CLI (`cycle`, `dashboard`, `seed`, `status`)
- GitHub Actions CI (test + typecheck on every push)
- GitHub Actions Release (Docker image to GHCR on tag)

**Dashboard v2**
- Social tab: post draft approval queue, DM reply queue, platform connection status, growth tracker
- Platforms tab: enrollment status, IP protection badges, connector flag reference
- Music tab: royalty history, sync deal approvals, Content ID claim log
- Growth tab: follower delta tracker, content calendar, optimal posting times
- WCAG 2.1 AA accessibility throughout

**Hackathon Submissions**
- ETHOnline 2026 (deadline Sept 13, $82K)
- Music Tectonics Swimming with Narwhals (deadline Sept 23)
- AssemblyAI Voice Agent (deadline Sept 30, $10K)

### Changed
- `SourceClass` union extended with 6 new values
- `CompensationAsset` extended with `STRIPE`, `ACH`, `ROYALTY`
- `WorldState` extended with `socialPosts`, `notifications`, `ipVault`
- 8 new soft reason codes
- Scoring engine updated for all new source classes
- 13 new connector feature flags
- Root package.json: version 1.0.0, Electron workspace added

## [0.1.0] — 2026-09-04

### Added
- Initial release: domain types, scoring rubric, mock pipeline, treasury floor, dashboard, acceptance tests
- 8 agents: Orchestrator, Scout, Qualifier, Risk, Executor, Treasury, Ads Ops, Creative Factory
- Ads floor protection across Google, Meta, TikTok, X
- Watch-only Ethereum wallet monitoring
- Verified airdrop queuing with human gate
- Firebase/Firestore + local file store
