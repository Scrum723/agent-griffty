import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROMPT_VERSION = "v1";

export type PromptRole =
  | "policy"
  | "orchestrator"
  | "scout"
  | "qualifier"
  | "executor"
  | "treasury"
  | "ads-ops"
  | "risk"
  | "creative";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts", PROMPT_VERSION);

export function loadPrompt(role: PromptRole): string {
  return readFileSync(path.join(dir, `${role}.md`), "utf8");
}

export function agentSystemPrompt(role: Exclude<PromptRole, "policy">): string {
  return `${loadPrompt("policy")}\n\n${loadPrompt(role)}`;
}

export function listRoles(): PromptRole[] {
  return [
    "policy",
    "orchestrator",
    "scout",
    "qualifier",
    "executor",
    "treasury",
    "ads-ops",
    "risk",
    "creative",
  ];
}
