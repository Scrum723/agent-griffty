#!/usr/bin/env node
/**
 * griffty CLI
 * Usage: griffty <command> [options]
 *
 * Commands:
 *   cycle       Run one orchestrator cycle
 *   dashboard   Start the API server + dashboard
 *   seed        Seed the state with sample opportunities
 *   status      Print current world state summary
 *   help        Show this help message
 */

const [,, command, ...args] = process.argv;

switch (command) {
  case 'cycle':
    await import('../scripts/run-cycle.js');
    break;
  case 'dashboard':
    console.log('Starting Griffty dashboard at http://127.0.0.1:8787');
    await import('../apps/server/src/index.js');
    break;
  case 'seed':
    await import('../scripts/seed.js');
    break;
  case 'hackathon': {
    const { runHackathonAutopilot } = await import('../scripts/hackathon-autopilot.js');
    await runHackathonAutopilot(args.includes('--approve'));
    break;
  }
  case 'status': {
    const { readFileSync } = await import('fs');
    const stateDir = process.env.GRIFFTY_STATE_DIR ?? '.griffty';
    try {
      const state = JSON.parse(readFileSync(`${stateDir}/state.json`, 'utf-8'));
      console.log('\n=== Griffty Status ===');
      console.log(`Operator:    ${state.operator?.displayName ?? 'unknown'}`);
      console.log(`Cash:        $${state.cashUsd ?? 0}`);
      console.log(`Cycle:       ${state.cycleId ?? 'none'}`);
      console.log(`KillSwitch:  ${state.killSwitch?.active ? 'ACTIVE' : 'off'}`);
      const opps = state.opportunities ?? [];
      console.log(`Opps seen:   ${opps.length} (${opps.filter((o: {status:string}) => o.status === 'blocked').length} blocked)`);
      const posts = state.socialPosts ?? [];
      console.log(`Social posts: ${posts.filter((p: {status:string}) => p.status === 'draft').length} drafts pending approval`);
      const tracks = state.ipVault?.tracks ?? [];
      console.log(`IP Vault:     ${tracks.length} tracks registered across 5 albums`);
      console.log();
    } catch {
      console.error('Could not read state. Run \'griffty seed\' first.');
      process.exit(1);
    }
    break;
  }
  case 'help':
  default:
    console.log(`
Griffty v1.0.0 — Autonomous income operating system for independent creators

Usage: griffty <command>

Commands:
  cycle       Run one orchestrator cycle (discover → score → execute → treasury)
  dashboard   Start the API server on http://127.0.0.1:8787
  seed        Seed state.json with sample opportunities and platforms
  status      Print a summary of current world state
  help        Show this help

Environment:
  GRIFFTY_STORE          file (default) | firestore
  GRIFFTY_STATE_DIR      path to state dir (default: .griffty)
  OPERATOR_TOKEN         API bearer token (default: dev-operator-token)
  XAI_API_KEY            xAI Grok API key (optional, uses deterministic rubric without it)

Docs: https://github.com/charlesclottin/agent-griffty
    `);
}
