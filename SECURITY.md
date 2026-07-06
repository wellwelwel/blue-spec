# Security Policy

- **Blue Spec** practices what it preaches.

## Is BlueSpec Safe?

**BlueSpec** is an open-source project, so you can see both the [**Source Code on GitHub Repository**](https://github.com/wellwelwel/blue-spec) and the [**Distribution Code on NPM**](https://www.npmjs.com/package/blue-spec?activeTab=code).

### Dashboard

The dashboard is the one part of **Blue Spec** that both reads your project and takes a command from the browser, so its surface is hardened end to end:

- **Private and local-only**: binds to `127.0.0.1`, never your network.
- **No shell, no eval, no subprocess**: actions run in-process through the same pure file-system core as the CLI.
- **Deny by default**: every value is rejected unless it matches **Blue Spec**'s own registries exactly, then it is rebuilt into a fresh object.
- **Forgery-proof**: each action needs a per-session token and a same-origin check, so cross-site requests fail closed.
- **Contained by default**: DNS rebinding, clickjacking, path traversal, oversized bodies, and slow-loris connections are all blocked up front.

> [!WARNING]
>
> Run the dashboard only on a machine you trust and control, never on a shared, unknown, multi-user, or compromised host.

---

## Supported Versions

Currently, security updates will be applied to the following versions of **BlueSpec**:

| Version | Supported          | Stage           |
| ------- | ------------------ | --------------- |
| 1.x.x   | :white_check_mark: | 🚧 Soon         |
| 0.x.x   | :x:                | 🧑🏻‍🔬 Experimental |

---

## Reporting a Vulnerability

- Please, give detailed reports
- Include steps to reproduce the vulnerability, and if possible, a patch or workaround.
- Include the specific version of **BlueSpec** you are using.

**Reporting:**

- [**github.com/wellwelwel/blue-spec/security/advisories**](https://github.com/wellwelwel/blue-spec/security/advisories)

> Once the issue has been resolved, you will be attributed a part of the report.
