import { SOURCE_FILTER } from '../../core/scan/filters.js';
import { walk as coreWalk } from '../../core/scan/walk.js';

export const walk = (displayRoot: string, target: string): Promise<string[]> =>
  coreWalk(displayRoot, target, SOURCE_FILTER);
