# Supported Agents

> The 72 AI agents Lagune works with, and the key for each, including Claude Code, Codex, Cursor, Gemini, and Copilot.

Canonical: https://lagune.ai/docs/supported-agents
Last updated: 2026-07-24

Lagune works with **72 AI coding agents**, including Claude Code, Codex, Cursor, Gemini CLI, and GitHub Copilot. Each agent maps to a CLI key you pass to `init`, listed in the table below.

Pick your agent by passing its key, for example `npx -y lagune@latest init <alias>`. Without it, **Lagune** asks you to choose.

```prompt
# For example, using Lagune with Claude
npx -y lagune@latest init claude
```

| Agent                                                                                       | Key (Alias)    |
| ------------------------------------------------------------------------------------------- | -------------- |
| [AdaL](https://docs.sylph.ai/)                                                              | `adal`         |
| [AiderDesk](https://github.com/hotovo/aider-desk)                                           | `aiderdesk`    |
| [Amazon Q Developer](https://aws.amazon.com/q/developer/)                                   | `amazonq`      |
| [Amp](https://ampcode.com/)                                                                 | `amp`          |
| [Antigravity](https://antigravity.google/)                                                  | `agy`          |
| [AstrBot](https://astrbot.app/)                                                             | `astrbot`      |
| [Auggie CLI](https://docs.augmentcode.com/cli/overview)                                     | `auggie`       |
| [Autohand Code CLI](https://autohand.ai/)                                                   | `autohand`     |
| [Claude Code](https://www.anthropic.com/claude-code)                                        | `claude`       |
| [Cline](https://github.com/cline/cline)                                                     | `cline`        |
| [Code Studio](https://www.syncfusion.com/code-studio/)                                      | `codestudio`   |
| [CodeArts Agent (Huawei)](https://codearts.huaweicloud.com/)                                | `codearts`     |
| [CodeBuddy CLI](https://www.codebuddy.ai/cli)                                               | `codebuddy`    |
| [Codemaker](https://github.com/codemakerai)                                                 | `codemaker`    |
| [Codex CLI](https://github.com/openai/codex)                                                | `codex`        |
| [Command Code](https://commandcode.ai/)                                                     | `commandcode`  |
| [Continue](https://continue.dev/)                                                           | `continue`     |
| [Cortex Code (Snowflake)](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code) | `cortex`       |
| [CoStrict](https://github.com/zgsm-ai/costrict)                                             | `costrict`     |
| [Crush](https://github.com/charmbracelet/crush)                                             | `crush`        |
| [Cursor](https://cursor.sh/)                                                                | `cursor-agent` |
| [Deep Agents (LangChain)](https://github.com/langchain-ai/deepagents)                       | `deepagents`   |
| [Devin for Terminal](https://cli.devin.ai/docs)                                             | `devin`        |
| [Dexto](https://dexto.ai/)                                                                  | `dexto`        |
| [Eve](https://eve.dev/)                                                                     | `eve`          |
| [Factory Droid](https://factory.ai/)                                                        | `factory`      |
| [Firebender](https://docs.firebender.com/)                                                  | `firebender`   |
| [Forge](https://forgecode.dev/)                                                             | `forge`        |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli)                                   | `gemini`       |
| [GitHub Copilot](https://code.visualstudio.com/)                                            | `copilot`      |
| [Goose](https://block.github.io/goose/)                                                     | `goose`        |
| [Hermes](https://hermes-agent.nousresearch.com/)                                            | `hermes`       |
| [IBM Bob](https://www.ibm.com/products/bob)                                                 | `bob`          |
| [iFlow CLI](https://docs.iflow.cn/en/cli/quickstart)                                        | `iflow`        |
| [inference.sh](https://inference.sh/)                                                       | `inferencesh`  |
| [Jazz](https://github.com/lvndry/jazz)                                                      | `jazz`         |
| [Junie](https://junie.jetbrains.com/)                                                       | `junie`        |
| [Kilo Code](https://github.com/Kilo-Org/kilocode)                                           | `kilocode`     |
| [Kimi Code](https://code.kimi.com/)                                                         | `kimi`         |
| [Kiro CLI](https://kiro.dev/docs/cli/)                                                      | `kiro-cli`     |
| [Kode](https://github.com/shareAI-lab/kode)                                                 | `kode`         |
| [Lingma](https://lingma.aliyun.com/)                                                        | `lingma`       |
| [Loaf](https://github.com/levifig/loaf)                                                     | `loaf`         |
| [MCPJam](https://mcpjam.com/)                                                               | `mcpjam`       |
| [Mistral Vibe](https://github.com/mistralai/mistral-vibe)                                   | `vibe`         |
| [Moxby](https://moxby.com/)                                                                 | `moxby`        |
| [Mux](https://mux.coder.com/)                                                               | `mux`          |
| [Neovate](https://neovateai.dev/)                                                           | `neovate`      |
| [Ona](https://ona.com/)                                                                     | `ona`          |
| [OpenClaw](https://docs.openclaw.ai/)                                                       | `openclaw`     |
| [opencode](https://opencode.ai/)                                                            | `opencode`     |
| [OpenHands](https://docs.openhands.dev/)                                                    | `openhands`    |
| [Pi Coding Agent](https://pi.dev)                                                           | `pi`           |
| [Pochi](https://getpochi.com/)                                                              | `pochi`        |
| [PromptScript](https://getpromptscript.dev/)                                                | `promptscript` |
| [Qoder CLI](https://qoder.com/cli)                                                          | `qodercli`     |
| [Qwen Code](https://github.com/QwenLM/qwen-code)                                            | `qwen`         |
| [Reasonix](https://github.com/esengine/DeepSeek-Reasonix)                                   | `reasonix`     |
| [Replit](https://replit.com/)                                                               | `replit`       |
| [Roo Code](https://roocode.com/)                                                            | `roo`          |
| [RovoDev ACLI](https://www.atlassian.com/software/rovo-dev)                                 | `rovodev`      |
| [SHAI (OVHcloud)](https://github.com/ovh/shai)                                              | `shai`         |
| [Tabnine CLI](https://docs.tabnine.com/main/getting-started/tabnine-cli)                    | `tabnine`      |
| [Terramind](https://terramind.com/)                                                         | `terramind`    |
| [Tinycloud](https://tinycloud.cloudglue.dev/)                                               | `tinycloud`    |
| [Trae](https://www.trae.ai/)                                                                | `trae`         |
| [Warp](https://www.warp.dev/)                                                               | `warp`         |
| [Windsurf](https://windsurf.com/)                                                           | `windsurf`     |
| [ZCode](https://zcode.z.ai/)                                                                | `zcode`        |
| [Zed](https://zed.dev/)                                                                     | `zed`          |
| [Zencoder](https://zencoder.ai/)                                                            | `zencoder`     |
| [Zenflow](https://zencoder.ai/zenflow)                                                      | `zenflow`      |

## Frequently Asked Questions

### How many agents does Lagune support?

72.

### Does Lagune work with Cursor, GitHub Copilot, Hermes, and Gemini?

Yes. All three are supported, along with Claude Code, Codex, and 66 others.

### How do I pick my agent when installing?

Pass the agent's CLI key to init, for example npx -y lagune@latest init claude. Each agent's key is listed in the table.
