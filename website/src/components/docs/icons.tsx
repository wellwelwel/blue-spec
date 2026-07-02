import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiChevronRight,
  FiCode,
  FiCopy,
  FiCpu,
  FiFile,
  FiGithub,
  FiGlobe,
  FiGrid,
  FiHeart,
  FiKey,
  FiLayers,
  FiMenu,
  FiMoon,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiSun,
  FiTerminal,
  FiThumbsDown,
  FiThumbsUp,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import { RiMessageAi3Line } from 'react-icons/ri';

const registry = {
  activity: FiActivity,
  arrowLeft: FiArrowLeft,
  arrowRight: FiArrowRight,
  arrowUpRight: FiArrowUpRight,
  check: FiCheck,
  chevronRight: FiChevronRight,
  code: FiCode,
  copy: FiCopy,
  cpu: FiCpu,
  file: FiFile,
  github: FiGithub,
  globe: FiGlobe,
  grid: FiGrid,
  heart: FiHeart,
  key: FiKey,
  layers: FiLayers,
  menu: FiMenu,
  messageAi: RiMessageAi3Line,
  moon: FiMoon,
  play: FiPlay,
  refresh: FiRefreshCw,
  search: FiSearch,
  star: FiStar,
  sun: FiSun,
  terminal: FiTerminal,
  thumbsDown: FiThumbsDown,
  thumbsUp: FiThumbsUp,
  upload: FiUploadCloud,
  x: FiX,
} satisfies Record<string, IconType>;

export type DocsIconName = keyof typeof registry;

export const Icon = ({ name }: { name: DocsIconName }): ReactNode => {
  const Glyph = registry[name];
  return <Glyph aria-hidden='true' />;
};
