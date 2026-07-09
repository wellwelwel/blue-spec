import type { ScaffoldGroup, ScaffoldResult } from '../../../src/types/core.js';
import { describe, it, strict } from 'poku';
import { groupScaffoldOutcomes } from '../../../src/core/scaffold-groups.js';

const result = (created: string[], skipped: string[] = []): ScaffoldResult => ({
  created,
  skipped,
  manifestPath: '.lagune/manifest.json',
});

const group = (created: string[], skipped: string[] = []): ScaffoldGroup[] =>
  groupScaffoldOutcomes(result(created, skipped), 'Claude Code');

describe('grouping scaffold outcomes into categories', () => {
  it('buckets each .lagune path under its own category', () => {
    const groups = group([
      '.lagune/templates/charter-template.md',
      '.lagune/hooks/track.mjs',
      '.lagune/skills/regex.md',
      '.lagune/tracking.json',
    ]);

    strict.deepStrictEqual(
      groups.map((entry) => entry.label),
      ['Templates', 'Hooks', 'Sub-skills', 'State']
    );
  });

  it('keeps the State bucket to top-level .lagune files, not nested ones', () => {
    const groups = group(['.lagune/skills.json', '.lagune/skills/network.md']);
    const state = groups.find((entry) => entry.label === 'State');
    const subSkills = groups.find((entry) => entry.label === 'Sub-skills');

    strict.deepStrictEqual(
      state?.outcomes.map((outcome) => outcome.path),
      ['.lagune/skills.json']
    );
    strict.deepStrictEqual(
      subSkills?.outcomes.map((outcome) => outcome.path),
      ['.lagune/skills/network.md']
    );
  });

  it('labels the non-Lagune bucket with the agent name', () => {
    const groups = groupScaffoldOutcomes(
      result([
        '.claude/skills/lagune.charter/SKILL.md',
        '.claude/skills/lagune.detect/SKILL.md',
      ]),
      'Claude Code'
    );
    const agent = groups.find((entry) => entry.label === 'Claude Code');

    strict.strictEqual(agent?.baseDir, '.claude/skills/');
    strict.strictEqual(agent?.outcomes.length, 2);
    strict(
      !groups.some((entry) => entry.label === 'Agent commands'),
      'the bucket is named after the agent, not generic'
    );
  });

  it('derives the agent baseDir as the shared directory of its files', () => {
    const groups = group(['.opencode/commands/lagune.charter.md']);
    const agent = groups.find((entry) => entry.label === 'Claude Code');

    strict.strictEqual(agent?.baseDir, '.opencode/commands/');
  });

  it('carries the created or skipped status onto each outcome', () => {
    const groups = group(
      ['.lagune/templates/charter-template.md'],
      ['.lagune/templates/detect-template.md']
    );
    const templates = groups.find((entry) => entry.label === 'Templates');

    strict.deepStrictEqual(
      templates?.outcomes.map((outcome) => outcome.status),
      ['created', 'skipped']
    );
  });

  it('drops categories that have no outcomes', () => {
    const groups = group(['.lagune/hooks/regex.mjs']);

    strict.deepStrictEqual(
      groups.map((entry) => entry.label),
      ['Hooks']
    );
  });
});
