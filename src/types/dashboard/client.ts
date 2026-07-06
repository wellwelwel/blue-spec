import type { SkillGroupKey } from '../core.js';
import type { Finding, PhaseName, Severity } from './dashboard.js';

export type RouteScope =
  | 'overview'
  | 'findings'
  | 'sidequests'
  | 'charter'
  | 'skills'
  | 'settings';

export type SeverityFilter = Severity | 'All';

export type FindingTreeRow = {
  finding: Finding;
  depth: number;
};

export type PhaseMeta = {
  label: string;
  blurb: string;
  icon: IconName;
  tile: string;
  dot: string;
  badge: string;
};

export type LoadStatus = 'loading' | 'ready' | 'error';

export type IconName =
  | 'grid'
  | 'shield'
  | 'shieldCheck'
  | 'charter'
  | 'search'
  | 'sun'
  | 'moon'
  | 'chevronRight'
  | 'chevronLeft'
  | 'arrowUpRight'
  | 'arrowRight'
  | 'arrowUp'
  | 'flame'
  | 'alertTriangle'
  | 'layers'
  | 'check'
  | 'checkCircle'
  | 'plus'
  | 'more'
  | 'file'
  | 'link'
  | 'activity'
  | 'upload'
  | 'key'
  | 'terminal'
  | 'globe'
  | 'code'
  | 'compass'
  | 'live'
  | 'wifiOn'
  | 'wifiOff'
  | 'github'
  | 'heart'
  | 'book'
  | 'star'
  | 'play'
  | 'package'
  | 'x'
  | 'arrowLeft'
  | 'settings'
  | 'pull'
  | 'refresh'
  | 'download'
  | 'brain'
  | 'graduationCap'
  | 'copy'
  | 'checkSquare'
  | 'square'
  | 'upgrade'
  | 'pullDown'
  | 'chat'
  | 'messageAi'
  | 'robot'
  | 'cpu'
  | 'thumbsUp'
  | 'thumbsDown'
  | 'info'
  | 'bulb'
  | 'pencil';

export type AdmonitionKind = 'note' | 'info' | 'tip' | 'warning' | 'danger';

export type AdmonitionTone = {
  icon: IconName;
  accent: string;
};

export type Theme = 'light' | 'dark';

export type TypeSegment = { text: string; bold?: boolean };

export type PromptModalContent = {
  eyebrow: string;
  eyebrowIcon: IconName;
  title: string;
  subtitle: string;
  banner: string;
  hint: string;
  prompt: TypeSegment[];
};

export type PromptTone = 'neutral' | 'tip';

export type PromptSpec = {
  task: string;
  mention: string;
  readPath: string;
  reply: TypeSegment[];
  tone?: PromptTone;
};

export type AgentTheme = {
  key: string;
  name: string;
  icon: string;
  coloredIcon?: boolean;
  panel: string;
  ring: string;
  shadow: string;
  avatar: string;
  accent: string;
  cursor: string;
  readDot: string;
  userBubble: string;
  userText: string;
  userLabel: string;
  mention: string;
  agentName: string;
  readLabel: string;
  readPath: string;
  body: string;
  bodyStrong: string;
  actions: string;
  actionsHover: string;
};

export type VerdictKind = 'pending' | 'passed' | 'reproved';

export type InstallPresentation = {
  icon: IconName;
  tile: string;
  title: string;
  detail: string;
  action: { href: string; label: string } | null;
};

export type PhaseCommand = {
  key: string;
  label: string;
  icon: IconName;
  tone: string;
  command: string;
  purpose: string;
};

export type NextStep = 'Plan' | 'Harden' | 'Verify' | 'Stand down';

export type ChainStep = {
  phase: PhaseName;
  next: NextStep;
  kind: VerdictKind;
};

export type StepHint = {
  command: string;
  verb: string;
  eyebrow: string;
  eyebrowIcon: IconName;
  title: string;
};

export type HardenState = 'done' | 'active' | 'pending';

export type StepState = 'done' | 'active' | 'pending' | 'reproved';

export type Counts = {
  total: number;
  applied: number;
  verified: number;
};

export type PipelineStep = {
  label: string;
  detail: string;
  state: StepState;
};

export type Hotspot = {
  path: string;
  severities: Severity[];
};

export type Tone = {
  icon: string;
  value: string;
};

export type NavItem = {
  scope: RouteScope;
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
};

export type NavDirection = 'previous' | 'next';

export type Token =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'em'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'link'; value: string; href: string };

export type SkillGroupBadge = {
  key: SkillGroupKey;
  label: string;
  icon: string;
};

export type InstallAgent = {
  key: string;
  name: string;
  icon: string | null;
};

export type InstallCategory = {
  key: string;
  name: string;
  description: string;
  icon: string;
};

export type SettingsTab = 'install' | 'pull' | 'update' | 'specializations';

export type TabItem = {
  key: string;
  label: string;
  icon: IconName;
};

export type SettingsTabItem = {
  key: SettingsTab;
  label: string;
  icon: IconName;
};

export type InstallSubtab = 'agent' | 'specializations';

export type InstallSubtabItem = {
  key: InstallSubtab;
  label: string;
  icon: IconName;
};

export type ActionRunState = 'idle' | 'pending' | 'success' | 'error';

export type RunButton = { icon: IconName; label: string };

export type InstallModalState = {
  kind: 'install';
  run: ActionRunState;
  agentName: string;
  created: number;
  skipped: number;
};

export type PullModalState = {
  kind: 'pull';
  run: ActionRunState;
  created: number;
  skipped: number;
  defaultKey: string;
};

export type UpdateModalState = {
  kind: 'update';
  run: ActionRunState;
  refreshed: number;
  defaultKey: string;
};

export type SpecializeModalState = {
  kind: 'specialize';
  run: ActionRunState;
  added: number;
  removed: number;
};

export type ModalState =
  | InstallModalState
  | PullModalState
  | UpdateModalState
  | SpecializeModalState;

export type ActionModalHeader = {
  eyebrow: string;
  icon: IconName;
  title: string;
  subtitle: string;
};
