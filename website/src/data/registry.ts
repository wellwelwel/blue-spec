/*
 * Static mirrors of the package's own registries, kept plain-data so the
 * whole site can consume them without pulling in React. When one of the
 * sources below changes, reconcile the matching list here:
 *
 * - AGENT_SPECS in ../../../src/providers/registry.ts -> ALL_AGENTS
 * - SKILL_GROUPS in ../../../src/hooks/skills/groups.ts -> ALL_CATEGORIES
 */

export type Agent = {
  key: string;
  name: string;
  icon: string;
};

export type AgentEntry = Pick<Agent, 'key' | 'name'>;

export type Category = {
  key: string;
  name: string;
  desc: string;
  icon: string;
};

// The agents surfaced directly in the install grid; the rest fold into "more".
export const AGENTS: Agent[] = [
  { key: 'claude', name: 'Claude Code', icon: '/img/icons/claude.svg' },
  { key: 'codex', name: 'Codex CLI', icon: '/img/icons/codex.svg' },
  { key: 'cursor-agent', name: 'Cursor', icon: '/img/icons/cursor.svg' },
  { key: 'agy', name: 'Antigravity', icon: '/img/icons/antigravity.svg' },
  { key: 'opencode', name: 'opencode', icon: '/img/icons/opencode.svg' },
];

export const ALL_AGENTS: AgentEntry[] = [
  { key: 'adal', name: 'AdaL' },
  { key: 'aiderdesk', name: 'AiderDesk' },
  { key: 'amazonq', name: 'Amazon Q Developer' },
  { key: 'amp', name: 'Amp' },
  { key: 'agy', name: 'Antigravity' },
  { key: 'astrbot', name: 'AstrBot' },
  { key: 'auggie', name: 'Auggie CLI' },
  { key: 'autohand', name: 'Autohand Code CLI' },
  { key: 'claude', name: 'Claude Code' },
  { key: 'cline', name: 'Cline' },
  { key: 'codestudio', name: 'Code Studio' },
  { key: 'codearts', name: 'CodeArts Agent (Huawei)' },
  { key: 'codebuddy', name: 'CodeBuddy CLI' },
  { key: 'codemaker', name: 'Codemaker' },
  { key: 'codex', name: 'Codex CLI' },
  { key: 'commandcode', name: 'Command Code' },
  { key: 'continue', name: 'Continue' },
  { key: 'cortex', name: 'Cortex Code (Snowflake)' },
  { key: 'costrict', name: 'CoStrict' },
  { key: 'crush', name: 'Crush' },
  { key: 'cursor-agent', name: 'Cursor' },
  { key: 'deepagents', name: 'Deep Agents (LangChain)' },
  { key: 'devin', name: 'Devin for Terminal' },
  { key: 'dexto', name: 'Dexto' },
  { key: 'eve', name: 'Eve' },
  { key: 'factory', name: 'Factory Droid' },
  { key: 'forge', name: 'Forge' },
  { key: 'gemini', name: 'Gemini CLI' },
  { key: 'copilot', name: 'GitHub Copilot' },
  { key: 'goose', name: 'Goose' },
  { key: 'hermes', name: 'Hermes' },
  { key: 'bob', name: 'IBM Bob' },
  { key: 'iflow', name: 'iFlow CLI' },
  { key: 'inferencesh', name: 'inference.sh' },
  { key: 'jazz', name: 'Jazz' },
  { key: 'junie', name: 'Junie' },
  { key: 'kilocode', name: 'Kilo Code' },
  { key: 'kimi', name: 'Kimi Code' },
  { key: 'kiro-cli', name: 'Kiro CLI' },
  { key: 'kode', name: 'Kode' },
  { key: 'lingma', name: 'Lingma' },
  { key: 'loaf', name: 'Loaf' },
  { key: 'mcpjam', name: 'MCPJam' },
  { key: 'vibe', name: 'Mistral Vibe' },
  { key: 'moxby', name: 'Moxby' },
  { key: 'mux', name: 'Mux' },
  { key: 'ona', name: 'Ona' },
  { key: 'openclaw', name: 'OpenClaw' },
  { key: 'opencode', name: 'opencode' },
  { key: 'pi', name: 'Pi Coding Agent' },
  { key: 'pochi', name: 'Pochi' },
  { key: 'promptscript', name: 'PromptScript' },
  { key: 'qodercli', name: 'Qoder CLI' },
  { key: 'qwen', name: 'Qwen Code' },
  { key: 'reasonix', name: 'Reasonix' },
  { key: 'replit', name: 'Replit' },
  { key: 'roo', name: 'Roo Code' },
  { key: 'rovodev', name: 'RovoDev ACLI' },
  { key: 'shai', name: 'SHAI (OVHcloud)' },
  { key: 'tabnine', name: 'Tabnine CLI' },
  { key: 'terramind', name: 'Terramind' },
  { key: 'tinycloud', name: 'Tinycloud' },
  { key: 'trae', name: 'Trae' },
  { key: 'warp', name: 'Warp' },
  { key: 'windsurf', name: 'Windsurf' },
  { key: 'zcode', name: 'ZCode' },
  { key: 'zed', name: 'Zed' },
];

export const ALL_CATEGORIES: Category[] = [
  {
    key: 'owasp',
    name: 'OWASP',
    desc: 'Harden against the application security risks OWASP tracks: injection, broken access control, auth, and crypto failures',
    icon: '/img/icons/owasp.svg',
  },
  {
    key: 'infra',
    name: 'Infrastructure',
    desc: 'Harden container, workload, and serverless config: Dockerfile, Compose, Pod security, FaaS IAM and triggers',
    icon: '/img/icons/kubernetes.svg',
  },
  {
    key: 'ai',
    name: 'AI / LLM',
    desc: 'Harden AI and LLM integrations against prompt injection and unsafe tool, agent, retrieval, and MCP wiring',
    icon: '/img/icons/ai.svg',
  },
  {
    key: 'lovable',
    name: 'Lovable',
    desc: 'Harden AI-generated Supabase apps (Lovable and similar): RLS gaps, leaked service_role keys, and insecure defaults',
    icon: '/img/icons/lovable.svg',
  },
  {
    key: 'javascript',
    name: 'JavaScript',
    desc: 'Harden JavaScript and its runtimes against eval and child_process RCE, path traversal, and prototype pollution',
    icon: '/img/icons/javascript.svg',
  },
  {
    key: 'python',
    name: 'Python',
    desc: 'Harden Python against pickle and YAML deserialization RCE, str.format string traversal, and class pollution',
    icon: '/img/icons/python.svg',
  },
  {
    key: 'rust',
    name: 'Rust',
    desc: 'Harden Rust against unsound unsafe APIs, transmute misuse, integer overflow, and FFI boundary undefined behavior',
    icon: '/img/icons/rust.svg',
  },
  {
    key: 'c-cpp',
    name: 'C / C++',
    desc: 'Harden C and C++ against format-string bugs, buffer overflows, and out-of-bounds writes that enable code execution',
    icon: '/img/icons/cpp.svg',
  },
  {
    key: 'php',
    name: 'PHP',
    desc: 'Harden PHP against type-juggling auth bypass, object injection gadget chains, and insecure configuration defaults',
    icon: '/img/icons/php.svg',
  },
  {
    key: 'go',
    name: 'Go',
    desc: 'Harden Go against typed-nil interface bugs, goroutine data races, and unsafe concurrency on security paths',
    icon: '/img/icons/go.svg',
  },
  {
    key: 'java',
    name: 'Java',
    desc: 'Harden Java against ObjectInputStream deserialization gadget chains that culminate in remote code execution',
    icon: '/img/icons/java.svg',
  },
  {
    key: 'ruby',
    name: 'Ruby',
    desc: 'Harden Ruby against Marshal.load and YAML deserialization gadget chains that reach remote code execution',
    icon: '/img/icons/ruby.svg',
  },
  {
    key: 'dotnet',
    name: '.NET',
    desc: 'Harden .NET and C# against BinaryFormatter deserialization RCE and the encoder bypasses that reach XSS',
    icon: '/img/icons/dot-net.svg',
  },
];
