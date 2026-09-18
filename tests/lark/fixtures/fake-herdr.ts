// herdr as the daemon sees it, without spawning anything.
import type { HerdrDeps } from '../../../skills/agent-lark/src/daemon.js';
import { findPaneForProject, type AgentInfo, type PromptOutcome } from '../../../skills/agent-lark/src/herdr.js';

export interface FakeHerdr {
  deps: HerdrDeps;
  agents: AgentInfo[];
  prompts: Array<{ paneId: string; text: string }>;
  /** Keys pressed with sendKeys, oldest first. */
  keys: Array<{ paneId: string; key: string }>;
  /** What promptPane answers; defaults to accepted. */
  outcome: PromptOutcome;
  /** What sendKeys answers; defaults to accepted. */
  keysOutcome: PromptOutcome;
}

/** An agent entry as `herdr agent list` reports it, with the fields a test cares about on top. */
export function agentEntry(over: Partial<AgentInfo> & { pane_id: string }): AgentInfo {
  return { agent: 'claude', agent_status: 'idle', cwd: '/p', focused: false, ...over };
}

export function createFakeHerdr(opts: { agents?: AgentInfo[]; outcome?: PromptOutcome } = {}): FakeHerdr {
  const fake: FakeHerdr = {
    agents: opts.agents ?? [],
    prompts: [],
    keys: [],
    outcome: opts.outcome ?? { ok: true },
    keysOutcome: { ok: true },
    deps: {
      agentList: async () => fake.agents,
      promptPane: async (paneId, text) => {
        fake.prompts.push({ paneId, text });
        return fake.outcome;
      },
      sendKeys: async (paneId, key) => {
        fake.keys.push({ paneId, key });
        return fake.keysOutcome;
      },
      findPaneForProject,
    },
  };
  return fake;
}
