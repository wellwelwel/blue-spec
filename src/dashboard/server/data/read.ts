import { readdir, readFile } from 'node:fs/promises';
import { stripComments } from './markdown/comments';

export const readText = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
};

export const readMarkdown = async (path: string): Promise<string | null> => {
  const text = await readText(path);
  return text === null ? null : stripComments(text);
};

export const readSkillNames = async (dir: string): Promise<string[]> => {
  try {
    const entries = await readdir(dir);
    return entries
      .filter((entry) => entry.endsWith('.md'))
      .map((entry) => entry.slice(0, -'.md'.length));
  } catch {
    return [];
  }
};
