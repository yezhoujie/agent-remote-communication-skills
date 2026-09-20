# agent-remote-communication-skills

[![skills.sh](https://skills.sh/b/yezhoujie/lark-connector)](https://skills.sh/yezhoujie/lark-connector)
[![skills.sh](https://skills.sh/b/yezhoujie/ntfy-connector)](https://skills.sh/yezhoujie/ntfy-connector)

**The code has moved to two independent repositories**: [lark-connector](https://github.com/yezhoujie/lark-connector)
(Feishu / Lark channel, skill `agent-lark`) and [ntfy-connector](https://github.com/yezhoujie/ntfy-connector)
(ntfy channel, skill `agent-ntfy`). Install with `npx skills add yezhoujie/lark-connector` or
`npx skills add yezhoujie/ntfy-connector`. This repository now only holds the comparison doc and the Claude
Code plugin marketplace below.

**代码已迁到两个独立仓库**：[lark-connector](https://github.com/yezhoujie/lark-connector)（飞书通道，skill
`agent-lark`）与 [ntfy-connector](https://github.com/yezhoujie/ntfy-connector)（ntfy 通道，skill `agent-ntfy`）。
安装改用 `npx skills add yezhoujie/lark-connector` 或 `npx skills add yezhoujie/ntfy-connector`。本仓现在只留
对比文档与下面的 Claude Code plugin marketplace。

Two skills that let any AI coding CLI push the decisions it cannot make on its own to your phone, and bring
your verdict — or any instruction — straight back into the agent's session. Same idea, two channels:
**agent-ntfy** goes through [ntfy](https://ntfy.sh), **agent-lark** through a Feishu / Lark group.

两个 skill，让任意 AI coding CLI 把它自己拿不定的事推到你的手机，再把你的裁决或任何指令直接送回 agent 的会话。
同一件事、两条通道：**agent-ntfy** 走 [ntfy](https://ntfy.sh)，**agent-lark** 走飞书群。

Not sure which one? [COMPARISON.md](COMPARISON.md) (English) · [COMPARISON.zh-CN.md](COMPARISON.zh-CN.md)（中文）.

## Install as a Claude Code plugin

Both skills are also published as a Claude Code plugin marketplace from this repository — an alternative to
`npx skills add` if you use Claude Code:

```bash
claude plugin marketplace add yezhoujie/agent-remote-communication-skills
claude plugin install agent-ntfy@agent-remote-communication-skills   # or agent-lark@agent-remote-communication-skills
```

Each plugin carries exactly one skill; its content comes from the `skill/` directory of its own repository (a
git-subdir source) — no test suites, nothing to build. Plugin skills are namespaced, so the invocation name is
`/agent-ntfy:agent-ntfy` (and `/agent-lark:agent-lark`) instead of the bare name `npx skills add` gives you.
Pick one route per project: installing both ways leaves two copies of the same skill in one session. Update a
plugin with `claude plugin update agent-ntfy`; refresh the listing first with
`/plugin marketplace update agent-remote-communication-skills`. The catalog itself is
[`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json).

也可以通过 Claude Code plugin marketplace 安装：`claude plugin marketplace add yezhoujie/agent-remote-communication-skills`，
再 `claude plugin install agent-ntfy@agent-remote-communication-skills`；一个 plugin 只含一个 skill，调用名带名空间
（`/agent-ntfy:agent-ntfy`），同一个项目只选一种安装方式。

## Repository

- Releases: each repository keeps its own CHANGELOG and tags `vX.Y.Z` —
  [lark-connector/CHANGELOG.md](https://github.com/yezhoujie/lark-connector/blob/main/CHANGELOG.md) ·
  [ntfy-connector/CHANGELOG.md](https://github.com/yezhoujie/ntfy-connector/blob/main/CHANGELOG.md)
- License: [MIT](LICENSE)
