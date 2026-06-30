export type InitArgs = {
  init?: boolean;
  agent?: string;
  skills?: string[];
};

export type ManifestSeed = {
  name?: string;
  version?: string;
  agent?: string | string[];
  createdAt?: string;
  files?: string[];
  categories?: string[];
};

export type Frontmatter = {
  name?: string;
  description: string;
  'argument-hint'?: string;
  'user-invocable'?: boolean;
};

export type SpecLimits = {
  nameChars: number;
  descriptionChars: number;
  tokens: number;
  lines: number;
};

export type SpecMeasurement = {
  relativePath: string;
  nameChars: number;
  descriptionChars: number;
  tokens: number;
  lines: number;
};

export type SpecLimitViolation = {
  limit: keyof SpecLimits;
  actual: number;
  max: number;
};
