import type { WalkFilter } from '../../types/scan.js';
import {
  BASE_IGNORED_DIR_PATTERNS,
  BASE_IGNORED_DIRS,
} from '../../core/scan/filters.js';
import { infraKindOf } from './kind.js';

export const INFRA_FILTER: WalkFilter = {
  ignoredDirs: BASE_IGNORED_DIRS,
  ignoredDirPatterns: BASE_IGNORED_DIR_PATTERNS,
  accept: (relativePath) => infraKindOf(relativePath) !== null,
};
