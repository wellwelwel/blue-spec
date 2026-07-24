# agent hook: Detect uncapped agent loops

> Sweep a codebase for agent/LLM calls with no step or time cap, or score a single call, from the command line.

Canonical: https://lagune.ai/docs/hooks/agent
Last updated: 2026-07-24

The `agent` hook flags **agent runtimes that loop with no turn, budget, or time cap**, the runaway-autonomy hole that turns a crafted input into unbounded cost or prompt-injection escalation. It is **language-aware**, covering the two agent-framework ecosystems: **JavaScript** (the **Claude** agent SDK `query` runtime) and **Python** (**LangChain**, **LangGraph**, **CrewAI**, **OpenAI Agents**). It is the deterministic engine behind the [`llm` sub-skill](https://lagune.ai/docs/commands/skills), which you can run yourself in **scan** or **check** mode.

## Run it

**Scan the codebase**

```bash
node ./.lagune/hooks/agent.mjs           # scans the whole project
node ./.lagune/hooks/agent.mjs -d src/ai # scans a directory
node ./.lagune/hooks/agent.mjs -f chat.ts # scans a single file
```

**Check a call**

```bash
node ./.lagune/hooks/agent.mjs -l javascript -p 'query({ prompt })'                        # => uncapped
node ./.lagune/hooks/agent.mjs -l javascript -p 'query({ prompt, options: { maxTurns: 5 } })' # => safe
node ./.lagune/hooks/agent.mjs -l python -p 'AgentExecutor(agent=a, max_iterations=None)' # => uncapped
```

Every line under **Uncapped agent loops found** is, in a file that imports an agent SDK, either the Claude agent SDK `query` runtime called with no turn, budget, or time cap (JavaScript, unbounded by default), or an explicit removal of a framework's default cap such as `max_iterations=None` / `max_turns=None` (Python, capped by default). Either exits non-zero. The Vercel AI SDK `generateText`/`streamText` default to a single step (`stopWhen: stepCountIs(1)`), so a bare call there cannot loop and is not flagged, and an ordinary `db.query(...)` is never mistaken for an agent call. A clean run prints `no uncapped agent loops found`.

## How to read the verdict

| Verdict    | Meaning                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `uncapped` | A `query` runtime call with no cap (JS), or an explicit cap removal (`=None`, Py).               |
| `safe`     | A `query` call that sets a cap, a single-step generation, or a capped-by-default framework call. |
| `invalid`  | The snippet contains no recognizable agent call to judge.                                        |

### CLI options

| Option      | Alias | Value          | Description                                                    |
| ----------- | ----- | -------------- | -------------------------------------------------------------- |
| `--pattern` | `-p`  | a code snippet | Check one call. Repeat to check several, one verdict per line. |
| `--lang`    | `-l`  | a language     | Required with `-p`: `javascript` or `python`.                  |
| `--dir`     | `-d`  | a directory    | Scope a scan to a directory. Repeats and combines with `-f`.   |
| `--file`    | `-f`  | a file         | Scope a scan to a single file. Repeats and combines with `-d`. |

With no option it scans the whole project. `-p` needs `-l` and cannot be combined with `-d` or `-f`.

**Best-effort, not exhaustive**

A hand-rolled agent loop, in any language, is beyond a static scan. Treat this as a strong floor, not a complete inventory.

**Tip**

The hook decides only the cap: capability scoping, trust mixing, and authorization are judgment the [`llm` sub-skill](https://lagune.ai/docs/commands/skills) still covers.

## Frequently Asked Questions

### Why cap an agent loop?

An uncapped agent can be driven into unbounded recursion, cost, or prompt-injection escalation. Setting maxTurns/maxBudgetUsd/stopWhen/signal bounds it, and the agent hook flags a query runtime call that sets none.
