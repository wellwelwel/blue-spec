# [PROJECT_NAME] Security Charter <!-- Example: the project's name followed by "Security Charter" -->

## Principles

<!-- Principles are reconciled, never appended: on a re-run, keep, rewrite, or remove each one to match the project as it is now. The two below are a shape to follow, not a quota. Write only the principles this project needs, and as many as it needs. -->

### [PRINCIPLE_1_NAME] <!-- Example: I. Secrets never live in code or version history -->

[PRINCIPLE_1_RULE] <!-- Example: All secrets load from the environment or a secrets manager. None are committed to the repository. -->

Why: [PRINCIPLE_1_RISK] <!-- Example: A leaked key in git history is a full account takeover, and history is forever. -->

### [PRINCIPLE_2_NAME] <!-- Example: II. All input is untrusted until validated -->

[PRINCIPLE_2_RULE] <!-- Example: Data from users, uploads, and third parties is validated and escaped before it is used in queries, commands, or output. -->

Why: [PRINCIPLE_2_RISK] <!-- Example: Unchecked input is how injection attacks take over a system, whether it is SQL in a query, a command in a shell call, or a script in a page. -->

## Governance <!-- Example: This charter supersedes ad hoc decisions. Changes are reviewed and the version is updated. -->

[GOVERNANCE_RULES]

Version: [VERSION] | Ratified: [RATIFICATION_DATE] <!-- Example: Version: 1.0.0 | Ratified: 2026-06-11 -->
