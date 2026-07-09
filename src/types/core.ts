export type CliCommand =
  'init' | 'update' | 'pull' | 'add' | 'remove' | 'list' | 'dashboard';

export type ParsedCliArgs = {
  command: CliCommand | undefined;
  agent: string | undefined;
  skills: string[];
  skillsRequested: boolean;
  findingsRequested: boolean;
  help: boolean;
  version: boolean;
  bare: boolean;
  port: number | undefined;
};

export type HookResult = {
  output: string;
  hasFinding: boolean;
};

export type HookReturn = string | HookResult;

export type HookHandler = (args: string[]) => Promise<HookReturn> | HookReturn;

export type SkillGroupKey =
  | 'owasp'
  | 'infra'
  | 'ai'
  | 'lovable'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'java'
  | 'ruby'
  | 'php'
  | 'go'
  | 'c-cpp'
  | 'dotnet';

export type SkillGroup = {
  key: SkillGroupKey;
  label: string;
  description: string;
};

export type BuiltinSkillEntry = {
  name: string;
  tags: string[];
  groups: SkillGroupKey[];
  required?: boolean;
};

export type SkillCatalogEntry = {
  name: string;
  tags: string[];
  groups: string[];
};

export type ListableSkillEntry = SkillCatalogEntry & { required?: boolean };

export type SkillsCatalogFile = {
  name: 'lagune';
  entries: SkillCatalogEntry[];
};

export type CommandKey =
  | 'lagune'
  | 'charter'
  | 'detect'
  | 'plan'
  | 'harden'
  | 'verify'
  | 'repair'
  | 'specialize'
  | 'prove';

export type TemplateKey = Exclude<CommandKey, 'lagune' | 'repair' | 'verify'>;

export type BundledAsset = {
  fileName: string;
  contents: string;
};

export type BundledAssets = {
  commands: Record<CommandKey, BundledAsset>;
  templates: Record<TemplateKey, BundledAsset>;
  hooks: BundledAsset[];
  skills: BundledAsset[];
};

export type SpecTokenCount = {
  relativePath: string;
  tokens: number;
};

export type FileStatus =
  'created' | 'refreshed' | 'skipped' | 'removed' | 'absent' | 'kept';

export type FileOutcome = {
  path: string;
  status: FileStatus;
  keptBy?: string;
};

export type GitignoreOutcome = 'created' | 'updated' | 'unchanged';

export type ScaffoldGroup = {
  label: string;
  baseDir: string;
  outcomes: FileOutcome[];
};

export type ScaffoldBucket = {
  label: string;
  baseDir: string;
  owns: (path: string) => boolean;
};

export type SkillsChange = {
  outcomes: FileOutcome[];
  categories: string[];
};

export type ManifestChange = {
  categories: string[];
  addFiles: string[];
  removeFiles: string[];
};

export type CommandWrite = {
  relativePath: string;
  contents: string;
};

export type CommandFormat =
  | 'skill'
  | 'copilot-prompt'
  | 'markdown'
  | 'forge'
  | 'gemini-toml'
  | 'goose-yaml';

export type CommandLayout = 'skill' | 'file';

export type AgentSpec = {
  key: string;
  displayName: string;
  format: CommandFormat;
  dir: string;
  extension?: string;
  layout?: CommandLayout;
};

export type AgentProvider = {
  key: string;
  displayName: string;
  buildCommands: (assets: BundledAssets) => CommandWrite[];
};

export type AgentChoice = {
  key: string;
  displayName: string;
};

export type SelectOption = {
  label: string;
  keywords?: string;
  selected?: boolean;
  locked?: boolean;
};

export type SelectConfig = {
  title: string;
  hint: string;
  options: SelectOption[];
  maxVisible?: number;
  emptyLabel?: string;
  confirmLabel?: string;
  footer?: string;
};

export type ListTarget = 'findings' | 'skills';

export type FilteredOption = {
  option: SelectOption;
  index: number;
};

export type SelectRowRenderer = (
  entry: FilteredOption,
  isActive: boolean
) => string;

export type KeypressEvent = {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
};

export type SelectAgentDeps = {
  isInteractive: () => boolean;
  promptForAgent: (
    agents: AgentChoice[],
    installed: string[]
  ) => Promise<string>;
};

export type SelectCategoriesInput = {
  requested: string[];
  shouldPrompt: boolean;
  groups: SkillGroup[];
  preselected: string[];
  locked: string[];
};

export type SelectCategoriesDeps = {
  isInteractive: () => boolean;
  promptForSkills: (
    groups: SkillGroup[],
    options: { preselected: string[]; locked: string[] }
  ) => Promise<string[]>;
};

export type ScaffoldOptions = {
  targetDir: string;
  provider?: AgentProvider;
  assets: BundledAssets;
};

export type RefreshOptions = {
  targetDir: string;
  providers: AgentProvider[];
  assets: BundledAssets;
  version: string;
  now: Date;
};

export type ReconstructOptions = {
  targetDir: string;
  providers: AgentProvider[];
  assets: BundledAssets;
};

export type ScaffoldResult = {
  created: string[];
  skipped: string[];
  manifestPath: string;
};

export type PerformInitInput = {
  cwd: string;
  packageRoot: URL;
  provider?: AgentProvider;
  categoryKeys: string[];
  now: Date;
};

export type PerformInitResult = {
  scaffold: ScaffoldResult;
  gitignore: GitignoreOutcome;
  installedAgents: string[];
};

export type PerformPullInput = {
  cwd: string;
  packageRoot: URL;
};

export type PerformPullResult =
  | { initialized: false }
  | {
      initialized: true;
      scaffold: ScaffoldResult;
      gitignore: GitignoreOutcome;
      agents: string[];
    };

export type RefreshResult = {
  refreshed: string[];
  manifestPath: string;
};

export type PerformUpdateInput = {
  cwd: string;
  packageRoot: URL;
  now: Date;
};

export type PerformUpdateResult =
  | { initialized: false }
  | {
      initialized: true;
      refresh: RefreshResult;
      agents: string[];
    };

export type PerformSpecializeInput = {
  cwd: string;
  packageRoot: URL;
  categories: string[];
  now: Date;
};

export type PerformSpecializeResult =
  | { initialized: false }
  | {
      initialized: true;
      added: number;
      removed: number;
      categories: string[];
    };

export type ManifestAgent = string | string[];

export type ManifestInstall = {
  agents: string[];
  categories: string[];
};

export type ManifestInput = {
  version: string;
  agent: string;
  now: Date;
  files: string[];
  categories: string[];
};

export type ManifestData = {
  name: 'lagune';
  version: string;
  agent: ManifestAgent;
  createdAt: string;
  files: string[];
  categories: string[];
};

export type TrackingEntry = {
  name: string;
  paths: string[];
};

export type TrackingMap = {
  name: 'lagune';
  entries: TrackingEntry[];
};

export type ObservedEntry = {
  name: string;
  paths: string[];
};

export type EntryClassification = 'new' | 'moved' | 'unchanged';

export type ClassifiedEntry = {
  name: string;
  classification: EntryClassification;
};

export type UnresolvedReason = 'orphan' | 'renamed-candidate';

export type UnresolvedEntry = {
  name: string;
  paths: string[];
  reason: UnresolvedReason;
};

export type ReconcileResult = {
  updatedMap: TrackingMap;
  classifications: ClassifiedEntry[];
  unresolved: UnresolvedEntry[];
};

export type TrackResult = {
  updatedMap: TrackingMap;
  classifications: ClassifiedEntry[];
};

export type ItemMatch = {
  entry: TrackingEntry;
  classification: ClassifiedEntry;
};

export type FoldState = {
  map: TrackingMap;
  classifications: ClassifiedEntry[];
};

export type RemovalResult = {
  updatedMap: TrackingMap;
  removed: string[];
  notFound: string[];
};

export type Block = {
  name: string;
  body: string;
};

export type MarkdownLine = {
  text: string;
  code: boolean;
};

export type TextSpan = {
  from: number;
  to: number;
};

export type SectionRemoval = {
  content: string;
  removed: boolean;
};

export type ProseRemovalStatus = 'edited' | 'removed' | 'unchanged' | 'absent';

export type DanglingMention = {
  name: string;
  line: number;
  text: string;
};

export type ProseRemoval = {
  file: string;
  status: ProseRemovalStatus;
  removed: string[];
  dangling: DanglingMention[];
};

export type HistoryEntry = {
  name: string;
  classification: string;
  category: string;
  whatItIs: string;
  closed: string;
};

export type HistoryAppend = {
  file: string;
  recorded: string[];
};

export type UntrackSummary = {
  removed: string[];
  notFound: string[];
  prose: ProseRemoval[];
  history: HistoryAppend;
};
