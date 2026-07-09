import type { DanglingMention, ProseRemoval } from '../../types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  removeFileIfPresent,
  writeFileOverwrite,
} from '../../core/fs-actions.js';
import { hasFindingSection, removeSection } from '../../core/sections.js';

const MEMORY_FILES = [
  '.lagune/memory/detect.md',
  '.lagune/memory/plan.md',
  '.lagune/memory/harden.md',
] as const;

const readMarkdown = async (path: string): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
};

const removeNamesFrom = (
  markdown: string,
  names: string[]
): { content: string; removedFrom: string[] } =>
  names.reduce<{ content: string; removedFrom: string[] }>(
    (state, name) => {
      const result = removeSection(state.content, name);

      return result.removed
        ? { content: result.content, removedFrom: [...state.removedFrom, name] }
        : state;
    },
    { content: markdown, removedFrom: [] }
  );

const findDanglingMentions = (
  content: string,
  names: string[]
): DanglingMention[] =>
  content
    .split('\n')
    .flatMap((line, index) =>
      names
        .filter((name) => line.includes(name))
        .map((name) => ({ name, line: index + 1, text: line.trim() }))
    );

export const removeSectionsFromMemory = async (
  targetDir: string,
  names: string[]
): Promise<ProseRemoval[]> =>
  Promise.all(
    MEMORY_FILES.map(async (relativePath): Promise<ProseRemoval> => {
      const path = join(targetDir, relativePath);
      const original = await readMarkdown(path);

      if (original === undefined)
        return {
          file: relativePath,
          status: 'absent',
          removed: [],
          dangling: [],
        };

      const { content, removedFrom } = removeNamesFrom(original, names);

      if (content === original)
        return {
          file: relativePath,
          status: 'unchanged',
          removed: [],
          dangling: findDanglingMentions(content, names),
        };

      if (!hasFindingSection(content)) {
        await removeFileIfPresent(path);

        return {
          file: relativePath,
          status: 'removed',
          removed: removedFrom,
          dangling: [],
        };
      }

      await writeFileOverwrite(path, content);

      return {
        file: relativePath,
        status: 'edited',
        removed: removedFrom,
        dangling: findDanglingMentions(content, names),
      };
    })
  );
