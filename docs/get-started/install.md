# Install: Security Hardening in Any Project via npx

> Set Lagune up in any project, new or existing, with a single command via npx, and choose the security specializations that fit it.

Canonical: https://lagune.ai/docs/get-started/install
Last updated: 2026-07-24

**Lagune** adapts to your environment, whether it is a new project or an existing one.

**No keys**

No API keys are needed, it runs directly through your own agent ([**Claude**, **Codex**, and more](https://lagune.ai/docs/supported-agents)).

**CLI**

Run without an agent key and **Lagune** asks you to choose one, then which specializations to install:

```bash
npx -y lagune@latest init

# Example using Lagune with Claude and OWASP specializations
npx -y lagune@latest init claude --skills owasp
```

See every key in [**Supported Agents**](https://lagune.ai/docs/supported-agents).

**Any language**

🃏 **Lagune** runs on **Node.js** under the hood, you use whatever language you want.

## What gets created

Running **Lagune** in your project creates two things:

- **`.lagune/`** holds Lagune's state in that project: the charter, the artifact each phase produces, the on-demand skills you installed, and the internal tracking.
- **Agent commands** are written into your agent's own location, in its native format, so the `/lagune.*` commands are ready to run.

Your security work is committed alongside your code, versioned and reviewable like any other part of the project. **Lagune**'s own files are gitignored by default, since [`pull`](#pull) brings them back from the manifest.

## Update

To update **Lagune**'s own files and its commands to their latest versions, run:

```bash
npx -y lagune@latest update
```

**Tip**

Your charter, the artifacts each phase produces, the internal tracking, and any _sub_-skill you authored with [`/lagune.specialize`](https://lagune.ai/docs/commands/specialize) stay untouched.

## Pull

When you clone or fork a project that already has **Lagune**, run pull to install its files from the manifest:

```bash
npx -y lagune@latest pull
```

**Tip**

💡 Think of it as the **Lagune** equivalent of `npm i`, `pip install -r requirements.txt`, and the like.

## Specializations

**Lagune** ships focused security [**_sub_-skills**](https://lagune.ai/docs/commands/skills) grouped into **categories**, from `owasp` to per-language ones like `python`, `go`, and `rust`. You install them by category with the `--skills` flag. The flag is the same everywhere, so what you learn for `init` works for `add` and `remove` too.

The agent commands are always set up. Specializations are what you choose on top.

### Install at init

**Interactive**

`--skills` with no category opens an interactive picker (space to toggle, enter to confirm, empty to skip):

```bash
npx -y lagune@latest init claude --skills
```

**Pick categories**

Pass the categories after `--skills`, on the same line as the agent:

```bash
npx -y lagune@latest init claude --skills owasp
npx -y lagune@latest init claude --skills owasp javascript
```

**No specialization**

Without `--skills`, the agent is set up and no specialization is installed. You can always add them later:

```bash
npx -y lagune@latest init claude
```

### Add and remove anytime

The same `--skills` flag, without touching the agent.

**Add**

```bash
npx -y lagune@latest add --skills # interactive
npx -y lagune@latest add --skills owasp
npx -y lagune@latest add --skills owasp rust
```

**Remove**

```bash
npx -y lagune@latest remove --skills # interactive
npx -y lagune@latest remove --skills owasp
npx -y lagune@latest remove --skills owasp rust
```

### See what exists

`list` on its own asks what you want to see, the findings Lagune is tracking or the specialization categories, then prints that. Skip the prompt with a flag: `--findings` for the tracked findings, `--skills` for the categories.

```bash
npx -y lagune@latest list --skills
# Specializations .lagune/skills/
#   • owasp       [installed]  Harden against the application security risks OWASP tracks
#   • javascript  [available]  JavaScript and its runtimes
#   • php         [available]  PHP and its language-specific risks
#   • go          [available]  Go and its language-specific risks
#   ...
```

**Dashboard**

Run **Lagune** directly with no subcommand for an interactive live view, follow-up, and maintenance. It serves a dashboard and opens it on a random port:

```bash
npx -y lagune@latest
```

- [x] **Live Reload**
- [x] **Private** and **Local**
- [x] **Install**, **Pull**, **Update**, and **Manage** all **Lagune** features directly from your browser
- [x] No `node_modules` or `package.json` is needed 📦

![Lagune dashboard overview](https://lagune.ai/img/dashboard/01.webp)

![Lagune dashboard charter](https://lagune.ai/img/dashboard/02.webp)

![Lagune dashboard findings](https://lagune.ai/img/dashboard/03.webp)

![Lagune dashboard side quests](https://lagune.ai/img/dashboard/04.webp)

![Lagune dashboard finding detail](https://lagune.ai/img/dashboard/05.webp)

![Lagune dashboard skills](https://lagune.ai/img/dashboard/06.webp)

**Tip**

- 🚪 Use `--port` or `-p` to specify a custom port.
- ⏏️ Press `Ctrl+C` to stop.

**Any language**

🃏 **Lagune** runs on **Node.js** under the hood, you use whatever language you want.

## Requirements

You will need these tools installed on your system:

- [**Node.js (LTS)**](https://nodejs.org/en/download/package-manager)
- At least one of the [**Supported Agents**](https://lagune.ai/docs/supported-agents)

## Next

Once **Lagune** is set up, your agent unlocks a set of slash commands. See [**Commands**](https://lagune.ai/docs/get-started/commands).

## Frequently Asked Questions

### How do I install Lagune?

Run npx -y lagune@latest init in your project. It works in both new and existing projects.

### Does Lagune need an API key?

No. It runs through your own AI agent, so no API keys are required.

### What does Lagune add to my project?

A .lagune/ state directory and a set of slash commands your AI agent can run.

### How do I update Lagune?

Run npx -y lagune@latest update. Your charter, phase artifacts, and custom specializations stay untouched.

### What are the requirements?

Node.js (LTS) and at least one supported AI agent.
