# Xaman / XRPL — watch-only

**Public address (only identifier I will keep):** `rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4`

## Ledger status (validated live 2026-09-10 via XRPSCAN)

- **Account Status**: **ACTIVE** (Sequence: 106759368, Inception: 2026-09-04)
- **XRP Balance**: **16.835093 XRP** (~$9.76 USD)
- **Reserve Breakdown**:
  - Base account reserve: **10.00 XRP** (protocol requirement)
  - Trustline reserve: **2.00 XRP** (for SIGMA trustline)
  - Total locked reserve: **12.00 XRP**
  - **Free Spendable Liquidity**: **~4.835 XRP** (~$2.80 USD)
- **Active Trustlines**:
  - **SIGMA** (`5349474D...`, issuer: `rfKYWZ84fm9eVEdoTcsQCo1WdqMPyaUF5z`): Balance: **6.159438 SIGMA**
- **Recent DEX Activity**:
  - 2026-09-10 05:55:51 UTC: Swap executed on Magnetic DEX selling 3,083,439.1 SIGMA for +12.0466 XRP.

## Griffty Operating Rules for Xaman & Magnetic

1. **Watch-Only & Zero Seed Exposure**:
   - Griffty only maintains the public `rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4` address.
   - All swaps, offers, and AMM actions are generated as unsigned payloads for you to tap **Approve** inside Xaman.
2. **Reserve Preservation Floor**:
   - Griffty will **never** attempt a trade or swap that pushes your XRP below the 12.00 XRP reserve limit (to prevent transaction failures and locked trustline states).
   - Available trading size: **~4.83 XRP**.
3. **Magnetic Strategy (https://xmagnetic.org)**:
   - **XRP/MAG & XRP/SIGMA Liquidity Monitoring**: Track low-liquidity spikes to set profitable limit sell orders on remaining tokens.
   - **XRPL AMM Yield Pools (XLS-30d)**: Non-directional passive LP fee collection.
   - **Micro Profit Sweeps**: When trades yield net gains, sweep profit into core treasury or hold in spot XRP.
4. **Weekly Accumulation Objective (50+ New XRP)**:
   - **Target**: **+50.00 new XRP per week** as a key operational objective.
   - **Strategy**: Capitalize on Magnetic DEX liquidity spikes, micro-arbitrage on trustlines (SIGMA/MAG), and compound non-directional LP fee yields.
   - **Protection**: Strictly enforce the 12.00 XRP reserve limit so principal and trustlines remain secure.
   - **Authority**: Griffty formulates decisions independently, staging actions for operator final authority.

