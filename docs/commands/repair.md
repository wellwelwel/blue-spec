# /lagune.repair: Fix Broken Finding Tracking

> Repair the chain when a rename or a moved file confuses Lagune's tracking.

Canonical: https://lagune.ai/docs/commands/repair
Last updated: 2026-07-13

🧰 Repair the chain when a rename or a moved file confuses it.

**Internal maintenance, not a security phase**

Repair is not a sixth phase in the linear flow. Its job is to keep the tracking coherent.

```prompt
# It takes no input: it always repairs the whole chain
/lagune.repair
```

## How it works

Each detect finding is one tracked item that plan, harden, and verify carry forward, each acting on it and re-reporting it by name. That name, written identically as the section title in every artifact, is its identity throughout.

The one volatile thing the tracking stores is the file paths the item points at. Those paths live nowhere else, so a rename or a moved file can break the link only there, never in two diverging copies. When that happens, repair corrects the map (`.lagune/tracking.json`) so identity survives the rename. It reads the artifacts and the tracking map, reads your source only to learn a renamed file's new path, and never authors security content.

**Tip**

- It touches neither your code nor the prose artifacts, only the tracking.
- You rarely run it by hand. When a phase notices the chain is inconsistent, it runs repair for you and continues.
- The tracking it maintains lives in `.lagune/tracking.json`, internal state you never edit by hand.
