import type { DashboardData } from '../../../../types/dashboard/dashboard';
import { join, resolve } from 'node:path';
import { loadVersion } from '../../../../core/assets';
import { bulletField } from '../markdown/fields';
import { readMarkdown, readSkillNames, readText } from '../read';
import { parseTracking, pathsByName } from '../tracking';
import { buildCharter } from './charter';
import { buildFindings } from './findings';
import { buildInstall, missingFiles } from './install';
import { matchProject, matchVersion } from './meta';
import { buildPhases } from './phases';
import { buildSideQuests } from './sidequests';
import { buildSkills } from './skills';

export const buildData = async (
  bluespecDir: string,
  packageRoot: URL
): Promise<DashboardData> => {
  const [
    detect,
    plan,
    harden,
    charter,
    tracking,
    installedSkills,
    manifest,
    running,
  ] = await Promise.all([
    readMarkdown(join(bluespecDir, 'memory/detect.md')),
    readMarkdown(join(bluespecDir, 'memory/plan.md')),
    readMarkdown(join(bluespecDir, 'memory/harden.md')),
    readMarkdown(join(bluespecDir, 'memory/charter.md')),
    readText(join(bluespecDir, 'tracking.json')),
    readSkillNames(join(bluespecDir, 'skills')),
    readText(join(bluespecDir, 'manifest.json')),
    loadVersion(packageRoot).catch(() => null),
  ]);

  const findings = buildFindings(
    detect,
    plan,
    harden,
    pathsByName(parseTracking(tracking))
  );

  const { files, ...install } = buildInstall(manifest);

  return {
    project: matchProject(detect, charter),
    version: matchVersion(charter),
    tagline: 'Read-only view of .bluespec/ · live',
    scope: bulletField(detect, 'Scope'),
    dates: {
      mapped: bulletField(detect, 'Mapped'),
      planned: bulletField(plan, 'Planned'),
      hardened: bulletField(harden, 'Hardened'),
    },
    phases: buildPhases(charter, detect, plan, harden, findings),
    findings,
    sidequests: buildSideQuests(detect, plan, harden),
    charter: buildCharter(charter),
    skills: buildSkills(detect, installedSkills),
    install: {
      ...install,
      running,
      missing: await missingFiles(resolve(bluespecDir, '..'), files),
    },
  };
};
