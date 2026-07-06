import type { Finding } from '../../../../types/dashboard/dashboard';
import { severityRank, toSeverity } from '../../../shared/severity';
import { bulletField } from '../markdown/fields';
import { inlineText, slugify } from '../markdown/lines';
import { sectionBlocks } from '../markdown/sections';
import { parseSkills, parseUpholds } from '../parsers';

export const buildFindings = (
  detect: string | null,
  plan: string | null,
  harden: string | null,
  filesByName: Record<string, string[]>
): Finding[] => {
  const detectBlocks = sectionBlocks(detect, 'Findings');
  const planBlocks = sectionBlocks(plan, 'Fixes');
  const hardenBlocks = sectionBlocks(harden, 'Applied');
  const skills = parseSkills(detect);

  return detectBlocks
    .map((detected) => {
      const planned = planBlocks.find((block) => block.name === detected.name);
      const hardened = hardenBlocks.find(
        (block) => block.name === detected.name
      );
      const dependency = planned
        ? bulletField(planned.body, 'Depends on')
        : null;

      return {
        id: slugify(detected.name),
        name: detected.name,
        severity: toSeverity(
          planned ? bulletField(planned.body, 'Priority') : null
        ),
        whatItIs: inlineText(bulletField(detected.body, 'What it is')),
        whyItMatters: inlineText(bulletField(detected.body, 'Why it matters')),
        fix: inlineText(
          (hardened && bulletField(hardened.body, 'What changed')) ??
            (planned && bulletField(planned.body, 'Fix')) ??
            ''
        ),
        where: inlineText(hardened && bulletField(hardened.body, 'Where')),
        planned: Boolean(planned),
        status:
          (hardened && bulletField(hardened.body, 'Status')) ?? 'Not applied',
        verdict: (hardened && bulletField(hardened.body, 'Verdict')) ?? null,
        upholds: parseUpholds(
          planned ? bulletField(planned.body, 'Upholds') : null
        ),
        dependsOn: dependency
          ? { id: slugify(dependency), name: dependency }
          : null,
        skills: skills
          .filter((skill) => skill.surfaced?.includes(detected.name))
          .map((skill) => ({
            name: skill.name,
            label: skill.label,
            surfaced: skill.surfaced ?? '',
          })),
        files: filesByName[detected.name] ?? [],
      };
    })
    .sort(
      (left, right) =>
        severityRank(left.severity) - severityRank(right.severity)
    );
};
