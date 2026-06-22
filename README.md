<img src="./website/static/img/banner.png" />

# 🌊 Blue Spec: Security-Driven Hardening

[![Version](https://img.shields.io/npm/v/blue-spec?label=&color=2f7bff&logo=npm&logoColor=white)](https://www.npmjs.com/package/blue-spec)
[![Docs](https://img.shields.io/badge/Documentation-005eff?logo=docusaurus&logoColor=white)](https://bluespec.weslley.io)

**Blue Spec** helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.

- **Blue Spec** works with projects in **any programming language** and supports [**37 agents**](https://bluespec.weslley.io/docs/supported-agents) ✨

---

## Table of Contents

- 🌱 [**Get Started**](#get-started)
  - [**Install**](#install)
  - [**Commands**](#commands)
- 📦 [**Requirements**](#requirements)
- 🖖 [**Acknowledgements**](#acknowledgements)
- 🧑‍⚖️ [**License**](#license)

---

## Get Started

### Install

> **Blue Spec** adapts to your environment, whether it is a new project or an existing one.

```bash
npx -y blue-spec@latest init
```

- **Blue Spec** runs on **Node.js** under the hood, you use whatever language you want 🃏

### Commands

Once **Blue Spec** is set up in your project, your **AI** agent unlocks a set of slash commands:

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
| [**/bluespec.skills**](https://bluespec.weslley.io/docs/commands/skills)         | Loads an on-demand security _sub_-skill                                                    |
| [**/bluespec.repair**](https://bluespec.weslley.io/docs/commands/repair)         | Repairs **Blue Spec**'s internal tracking                                                  |
| [**/bluespec.list**](https://bluespec.weslley.io/docs/commands/list)             | Lists all finding **Blue Spec** is tracking, by name                                       |

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

## Security Policy

Please check the [**SECURITY.md**](https://github.com/wellwelwel/blue-spec/blob/main/SECURITY.md).

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
