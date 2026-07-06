<img src="./website/static/img/banner.png" />

# 🌊 Security-Driven Hardening: Blue Spec

[![Version](https://img.shields.io/npm/v/blue-spec?label=&color=2f7bff&logo=npm&logoColor=white)](https://www.npmjs.com/package/blue-spec)
[![Docs](https://img.shields.io/badge/Documentation-005eff?logo=docusaurus&logoColor=white)](https://bluespec.weslley.io/docs)

**Blue Spec** helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.

- **Blue Spec** works with projects in **any programming language** and supports [**37 agents**](https://bluespec.weslley.io/docs/supported-agents) ✨

---

Love **Blue Spec**? Give us a ⭐ on **GitHub**!

---

## Table of Contents

- 🌊 [**Get Started**](#get-started)
  - 📦 [**Dashboard**](#dashboard) | [**CLI**](#cli)
  - 💬 [**Slash Commands**](#slash-commands)
- 💽 [**Requirements**](#requirements)
- 🔐 [**Security**](#security)
- 🖖 [**Acknowledgements**](#acknowledgements)
- 🧑‍⚖️ [**License**](#license) (**MIT**)

---

### Get Started

**Blue Spec** adapts to your environment, whether it is a new project or an existing one.

> [!TIP]
>
> No API keys are needed, it runs directly through your own agent [(**Claude**, **Codex**, and more)](https://bluespec.weslley.io/docs/supported-agents).

---

### Dashboard

For an interactive live view, follow-up, and maintenance, run:

```bash
npx -y blue-spec@latest
```

It serves a dashboard and opens it in a random port:

- [x] **Live Reload**
- [x] **Private** and **Local**
- [x] **Install**, **Pull**, **Update**, and **Manage** all **Blue Spec** features directly from your browser
- [x] No `node_modules` or `package.json` is needed 📦

> <img width="280" src="./website/static/img/dashboard/01.png" />
> <img width="280" src="./website/static/img/dashboard/02.png" />
> <img width="280" src="./website/static/img/dashboard/03.png" />
> <img width="280" src="./website/static/img/dashboard/04.png" />
> <img width="280" src="./website/static/img/dashboard/05.png" />
> <img width="280" src="./website/static/img/dashboard/06.png" />

> [!TIP]
>
> - 🚪 Use `--port` or `-p` to specify a custom port.
> - ⏏️ Press `Ctrl+C` to stop.

---

### CLI

#### Install

```bash
npx -y blue-spec@latest init
```

- 🃏 **Blue Spec** runs on **Node.js** under the hood, you use whatever language you want.

#### Update

To update **Blue Spec**'s own files and its commands to their latest versions, run:

```bash
npx -y blue-spec@latest update
```

> [!TIP]
>
> Your charter, the phase artifacts, and any custom specializations stay untouched.

#### Pull

When you clone or fork a project that already has **Blue Spec**, run pull to install its files from the manifest:

```bash
npx -y blue-spec@latest pull
```

> [!TIP]
>
> 💡 Think of it as the **Blue Spec** equivalent of `npm i`, `pip install -r requirements.txt`, and the like.

---

### Slash Commands

Once **Blue Spec** is set up in your project, your **AI** agent unlocks a set of slash commands:

#### The Blue Team flow

These five run in order. Each builds on the previous, so following the list top to bottom is all it takes:

| #   | Command                                                                    | What it does for you                                                           |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | [**/bluespec.charter**](https://bluespec.weslley.io/docs/commands/charter) | Sets your project's security rules, proposed for you or shaped by what you say |
| 2   | [**/bluespec.detect**](https://bluespec.weslley.io/docs/commands/detect)   | Reads your code and maps what your system does and where the risks are         |
| 3   | [**/bluespec.plan**](https://bluespec.weslley.io/docs/commands/plan)       | Turns what detect found into a defense plan, with a fix for each finding       |
| 4   | [**/bluespec.harden**](https://bluespec.weslley.io/docs/commands/harden)   | Applies the plan's fixes to your code, safely and one at a time                |
| 5   | [**/bluespec.verify**](https://bluespec.weslley.io/docs/commands/verify)   | Proves each applied fix holds and closes out the ones that do                  |

> Each command builds on the previous, so following the list top to bottom is all it takes.

#### Special commands

| Command                                                                          | What it does                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [**/bluespec.specialize**](https://bluespec.weslley.io/docs/commands/specialize) | Specializes **Blue Spec** in a new security _sub_-skill from articles, exploits, or topics |
| [**/bluespec.prove**](https://bluespec.weslley.io/docs/commands/prove)           | Turns each detected finding into a runnable proof for responsible disclosure               |

> [!TIP]
>
> Security is not a cost, it is an investment: what you put in upfront, you save many times over in the incidents you never have 🙋🏻‍♂️

> [!IMPORTANT]
>
> See the full [**documentation**](https://bluespec.weslley.io/) for usage examples and more.

---

## Requirements

You will need these tools installed on your system:

- [**Node.js (LTS)**](https://nodejs.org/en/download/package-manager)
- At least one of the [**Supported Agents**](https://bluespec.weslley.io/docs/supported-agents)

---

## Security

To details, report a vulnerability, and see the supported versions, see the [**Security Policy**](https://github.com/wellwelwel/blue-spec/blob/main/SECURITY.md).

---

## Contributing

🚧 Coming Soon.

---

## Acknowledgements

### Partners

> Help **Blue Spec** grow by [**becoming a partner**](https://bluespec.weslley.io/?partners) 🖖

### Supporters

Really thanks to everyone who has supported and keeps supporting my work.

[![Sponsors](https://wellwelwel.github.io/wellwelwel/sponsors.svg?v=1)](https://github.com/sponsors/wellwelwel)

> Support **Blue Spec** by [**becoming a sponsor**](https://github.com/sponsors/wellwelwel) too ✨

---

## License

**Blue Spec** is under the [**MIT License**](https://github.com/wellwelwel/blue-spec/blob/main/LICENSE).<br />
Copyright © 2026-present [**Weslley Araújo**](https://github.com/wellwelwel) and [**contributors**](https://github.com/wellwelwel/blue-spec/graphs/contributors).

> [!IMPORTANT]
>
> ### Disclaimer
>
> **Security-Driven Hardening: Blue Spec** is an independent open-source project and is not affiliated with, endorsed by, or associated with **Bluespec, Inc.** or the **Bluespec Hardware Description Language (HDL)** and its compiler (`bsc`).
>
> The project name "Blue Spec" comes from Blue Team (defensive security) and Spec-Driven Development. It refers to an AI-assisted security hardening tool for software projects, a different domain from Bluespec, Inc., which provides RISC-V processor IP and hardware design tools.
>
> "Bluespec" is a trademark of Bluespec, Inc. All other product names, trademarks, and registered trademarks mentioned are the property of their respective owners and are used for identification purposes only.
