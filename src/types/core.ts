export type CliCommand = 'init';

export type ParsedCliArgs = {
  command: CliCommand | undefined;
  agent: string | undefined;
  help: boolean;
  version: boolean;
};

export type HookHandler = (args: string[]) => Promise<string> | string;

export type SkillCatalogEntry = {
  name: string;
  tags: string[];
};

export type SkillsCatalogFile = {
  name: 'blue-spec';
  entries: SkillCatalogEntry[];
};

export type CommandKey =
  | 'charter'
  | 'detect'
  | 'plan'
  | 'harden'
  | 'verify'
  | 'repair'
  | 'skills'
  | 'list'
  | 'specialize'
  | 'prove';

export type TemplateKey = Exclude<CommandKey, 'repair' | 'skills' | 'list'>;

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

export type FileStatus = 'created' | 'skipped';

export type FileOutcome = {
  path: string;
  status: FileStatus;
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
};

export type SelectConfig = {
  title: string;
  hint: string;
  options: SelectOption[];
  maxVisible?: number;
};

export type FilteredOption = {
  option: SelectOption;
  index: number;
};

export type KeypressEvent = {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
};

export type SelectAgentDeps = {
  isInteractive: () => boolean;
  promptForAgent: (agents: AgentChoice[]) => Promise<string>;
};

export type ScaffoldOptions = {
  targetDir: string;
  provider: AgentProvider;
  assets: BundledAssets;
  version: string;
  now: Date;
};

export type ScaffoldResult = {
  created: string[];
  skipped: string[];
  manifestPath: string;
};

export type ManifestInput = {
  version: string;
  agent: string;
  now: Date;
  files: string[];
};

export type ManifestData = {
  name: 'blue-spec';
  version: string;
  agent: string;
  createdAt: string;
  files: string[];
};

export type TrackingEntry = {
  name: string;
  paths: string[];
};

export type TrackingMap = {
  name: 'blue-spec';
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
