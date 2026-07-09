import type { SkillsCatalogFile } from '../types/core.js';

export const emptySkillsCatalog = (): SkillsCatalogFile => ({
  name: 'lagune',
  entries: [],
});

export const serializeSkillsCatalog = (catalog: SkillsCatalogFile): string =>
  `${JSON.stringify(catalog, null, 2)}\n`;
