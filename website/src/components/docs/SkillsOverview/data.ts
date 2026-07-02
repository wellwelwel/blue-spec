import type { DocsIconName } from '../icons';

/*
 * Static mirror of the built-in skill catalog (SKILLS_CATALOG in
 * ../../../../../src/hooks/skills/catalog.ts) with the groups already
 * resolved per skill and the plain-language copy authored here. The website
 * has no environment to detect, so the whole catalog renders as one list.
 * When a sub-skill is added or regrouped there, reconcile this list.
 */

export type SkillGroupTag = {
  label: string;
  icon: string;
};

export type CatalogSkill = {
  name: string;
  label: string;
  icon: DocsIconName;
  description: string;
  promptTask: string;
  groups: SkillGroupTag[];
};

const owasp: SkillGroupTag = { label: 'OWASP', icon: 'owasp' };
const infra: SkillGroupTag = { label: 'Infrastructure', icon: 'kubernetes' };
const ai: SkillGroupTag = { label: 'AI / LLM', icon: 'ai' };
const lovable: SkillGroupTag = { label: 'Lovable', icon: 'lovable' };
const javascript: SkillGroupTag = { label: 'JavaScript', icon: 'javascript' };
const python: SkillGroupTag = { label: 'Python', icon: 'python' };
const rust: SkillGroupTag = { label: 'Rust', icon: 'rust' };
const java: SkillGroupTag = { label: 'Java', icon: 'java' };
const ruby: SkillGroupTag = { label: 'Ruby', icon: 'ruby' };
const php: SkillGroupTag = { label: 'PHP', icon: 'php' };
const go: SkillGroupTag = { label: 'Go', icon: 'go' };
const cCpp: SkillGroupTag = { label: 'C / C++', icon: 'cpp' };
const dotnet: SkillGroupTag = { label: '.NET', icon: 'dot-net' };

export const skillsCatalog: CatalogSkill[] = [
  {
    name: 'access-control',
    label: 'Access Control',
    icon: 'key',
    description:
      "Makes sure people can only see and do what they are allowed to, so no one can reach another user's data or admin-only actions just by changing a link or an ID.",
    promptTask: 'Add an admin area to manage all the user accounts',
    groups: [owasp, lovable],
  },
  {
    name: 'api-endpoint',
    label: 'API Endpoint',
    icon: 'globe',
    description:
      "Checks the doors your app exposes to the outside world, so requests from strangers can't pull private data or trigger actions they shouldn't.",
    promptTask: 'Build an API so my mobile app can talk to the backend',
    groups: [owasp],
  },
  {
    name: 'browser',
    label: 'Browser',
    icon: 'globe',
    description:
      "Guards what runs in your visitors' browsers, so an attacker can't inject code that steals logins or hijacks what your users see and click.",
    promptTask: "Show each user's bio on their public profile page",
    groups: [javascript, lovable],
  },
  {
    name: 'c-cpp',
    label: 'C / C++',
    icon: 'code',
    description:
      'Catches low-level memory mistakes that let attackers crash the program or run their own code on your server.',
    promptTask: 'Build a native program with C++',
    groups: [cCpp],
  },
  {
    name: 'container',
    label: 'Container',
    icon: 'layers',
    description:
      'Reviews how your app is packaged and deployed, so a break-in stays contained instead of handing an attacker the whole machine.',
    promptTask: 'Package my app so I can deploy it to the cloud',
    groups: [owasp, infra],
  },
  {
    name: 'credential-endpoint',
    label: 'Credential Endpoint',
    icon: 'key',
    description:
      "Protects the login, signup, and password-reset flows, so attackers can't guess passwords, take over accounts, or reset someone else's.",
    promptTask: 'Build sign up, login, and forgot-password for my app',
    groups: [owasp, lovable],
  },
  {
    name: 'crypto',
    label: 'Crypto',
    icon: 'key',
    description:
      "Makes sure sensitive data is scrambled properly, so passwords, tokens, and personal info can't be read even if they leak.",
    promptTask: 'Let people create an account with a password and log back in',
    groups: [owasp, lovable],
  },
  {
    name: 'csv',
    label: 'CSV',
    icon: 'file',
    description:
      "Keeps exported spreadsheets safe, so opening a downloaded file can't quietly run a harmful command on someone's computer.",
    promptTask: 'Add a button to export my contacts to a spreadsheet',
    groups: [owasp],
  },
  {
    name: 'dotnet',
    label: '.NET',
    icon: 'code',
    description:
      'Covers security pitfalls specific to .NET apps that can let an attacker run their own code on your server.',
    promptTask: 'Build a desktop app with .NET',
    groups: [dotnet],
  },
  {
    name: 'federation',
    label: 'Federation',
    icon: 'key',
    description:
      "Secures “sign in with Google/Microsoft/etc.” so an attacker can't impersonate a user or slip into an account that isn't theirs.",
    promptTask: 'Add a “Continue with Google” button to my login page',
    groups: [owasp],
  },
  {
    name: 'go',
    label: 'Go',
    icon: 'code',
    description:
      'Covers security pitfalls specific to Go apps, especially subtle bugs that show up under real traffic.',
    promptTask: 'Build an API service with Go',
    groups: [go],
  },
  {
    name: 'http-request',
    label: 'HTTP Request',
    icon: 'globe',
    description:
      "Inspects the data that arrives with each web request, so hidden or malicious input can't bend your app into doing the wrong thing.",
    promptTask: 'Let users update their email from their profile page',
    groups: [owasp],
  },
  {
    name: 'interpreter',
    label: 'Interpreter',
    icon: 'terminal',
    description:
      "Stops user input from being run as commands, so a form field or upload can't make your server execute an attacker's instructions.",
    promptTask:
      'Add a field where people can write their own formulas, like in an Excel spreadsheet',
    groups: [owasp, lovable],
  },
  {
    name: 'java',
    label: 'Java',
    icon: 'code',
    description:
      'Covers security pitfalls specific to Java apps that can let an attacker run their own code on your server.',
    promptTask: 'Build a backend with Java',
    groups: [java],
  },
  {
    name: 'javascript',
    label: 'JavaScript',
    icon: 'code',
    description:
      "Covers security pitfalls specific to JavaScript and Node apps, from running untrusted code to reading files it shouldn't.",
    promptTask: 'Build a web app with JavaScript',
    groups: [javascript],
  },
  {
    name: 'llm',
    label: 'LLM',
    icon: 'cpu',
    description:
      "Protects features built on AI models, so a cleverly worded message can't trick the AI into leaking data or misusing connected tools.",
    promptTask: 'Add a chatbot that answers questions from my help docs',
    groups: [ai, lovable],
  },
  {
    name: 'network',
    label: 'Network',
    icon: 'globe',
    description:
      "Checks how your app talks to other services, so it can't be tricked into fetching or trusting something an attacker controls.",
    promptTask: 'Let users paste a link and show a little preview of it',
    groups: [owasp],
  },
  {
    name: 'path',
    label: 'Path',
    icon: 'file',
    description:
      "Prevents attackers from wandering your server's files, so they can't read private files or overwrite important ones by manipulating a filename.",
    promptTask: 'Let people download their files by clicking on them',
    groups: [owasp],
  },
  {
    name: 'payment',
    label: 'Payment',
    icon: 'key',
    description:
      'Secures checkout and billing, so no one can tamper with prices, dodge payment, or replay a charge.',
    promptTask: 'Add Stripe checkout so customers can pay on the pricing page',
    groups: [owasp, lovable],
  },
  {
    name: 'php',
    label: 'PHP',
    icon: 'code',
    description:
      'Covers security pitfalls specific to PHP apps that can let an attacker run their own code or bypass a login.',
    promptTask: 'Build a website with PHP',
    groups: [php],
  },
  {
    name: 'python',
    label: 'Python',
    icon: 'code',
    description:
      "Covers security pitfalls specific to Python apps, especially loading untrusted data that can run an attacker's code.",
    promptTask: 'Build a data tool with Python',
    groups: [python],
  },
  {
    name: 'regex',
    label: 'Regex',
    icon: 'code',
    description:
      "Makes sure text checks are safe and efficient, so a malicious input can't freeze your app by overloading it.",
    promptTask: 'Add a coupon field to checkout that only accepts valid codes',
    groups: [owasp],
  },
  {
    name: 'ruby',
    label: 'Ruby',
    icon: 'code',
    description:
      "Covers security pitfalls specific to Ruby apps, especially loading untrusted data that can run an attacker's code.",
    promptTask: 'Build a web app with Ruby',
    groups: [ruby],
  },
  {
    name: 'rust',
    label: 'Rust',
    icon: 'code',
    description:
      'Covers security pitfalls specific to Rust apps, especially unsafe code that can corrupt memory or crash the program.',
    promptTask: 'Build a fast service with Rust',
    groups: [rust],
  },
  {
    name: 'serverless',
    label: 'Serverless',
    icon: 'activity',
    description:
      "Reviews cloud functions and their permissions, so a single function can't be abused to reach far more than it should.",
    promptTask:
      'Automatically make a thumbnail whenever someone uploads a photo',
    groups: [owasp, infra, lovable],
  },
  {
    name: 'supabase',
    label: 'Supabase',
    icon: 'layers',
    description:
      "Locks down your Supabase backend, so your database rules actually hold and secret keys don't end up exposed to the public.",
    promptTask: 'Set up Supabase so each user only sees their own notes',
    groups: [lovable],
  },
  {
    name: 'transport',
    label: 'Transport',
    icon: 'globe',
    description:
      "Makes sure data travels over a secure, encrypted connection, so it can't be read or altered on the way between your users and your app.",
    promptTask: 'Make my whole site load securely over https',
    groups: [owasp],
  },
  {
    name: 'upload',
    label: 'Upload',
    icon: 'upload',
    description:
      "Keeps file uploads safe, so someone can't upload a disguised file that runs code, overwrites data, or fills up your storage.",
    promptTask: 'Let people upload a profile photo in account settings',
    groups: [owasp],
  },
  {
    name: 'xml',
    label: 'XML',
    icon: 'file',
    description:
      "Secures how your app reads XML data, so a crafted file can't leak server files or knock your app offline.",
    promptTask: 'Let suppliers upload their invoices as XML files',
    groups: [owasp],
  },
];

export type AgentTheme = {
  name: string;
  icon: string;
  coloredIcon?: boolean;
  panel: string;
  ring: string;
  shadow: string;
  avatar: string;
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

const AGENT_THEMES: AgentTheme[] = [
  {
    name: 'Claude Code',
    icon: '/img/icons/claude.svg',
    panel: 'bg-[#262624]',
    ring: 'ring-1 ring-white/10',
    shadow:
      'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_18px_40px_-12px_rgba(0,0,0,0.6),0_40px_80px_-24px_rgba(0,0,0,0.7)]',
    avatar: 'bg-[#d97757]',
    cursor: '[&_.typed-cursor]:text-[#d97757]',
    readDot: 'bg-[#4ac57e]',
    userBubble: 'bg-[#30302e]',
    userText: 'text-[#f5f4ef]',
    userLabel: 'text-[#f5f4ef]/40',
    mention: 'text-[#e0876a]',
    agentName: 'text-[#faf9f5]',
    readLabel: 'text-[#e8e6dd]',
    readPath: 'text-[#e8e6dd]/55',
    body: 'text-[#e8e6dd]',
    bodyStrong: 'text-[#faf9f5]',
    actions: 'text-[#e8e6dd]/40',
    actionsHover: 'hover:bg-white/8 hover:text-[#faf9f5]',
  },
  {
    name: 'Codex',
    icon: '/img/icons/codex.svg',
    panel: 'bg-[#0d1117]',
    ring: 'ring-1 ring-white/8',
    shadow:
      'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),0_18px_40px_-12px_rgba(0,0,0,0.7),0_40px_80px_-24px_rgba(0,0,0,0.8)]',
    avatar: 'bg-[#a78bfa]',
    cursor: '[&_.typed-cursor]:text-[#a78bfa]',
    readDot: 'bg-[#3fb950]',
    userBubble: 'bg-[#1c2333]',
    userText: 'text-[#e6edf3]',
    userLabel: 'text-[#e6edf3]/40',
    mention: 'text-[#c4b5fd]',
    agentName: 'text-[#f0f6fc]',
    readLabel: 'text-[#c9d1d9]',
    readPath: 'text-[#c9d1d9]/55',
    body: 'text-[#c9d1d9]',
    bodyStrong: 'text-[#f0f6fc]',
    actions: 'text-[#c9d1d9]/40',
    actionsHover: 'hover:bg-white/8 hover:text-[#f0f6fc]',
  },
  {
    name: 'Cursor',
    icon: '/img/icons/cursor.svg',
    panel: 'bg-[#141414]',
    ring: 'ring-1 ring-white/10',
    shadow:
      'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),0_18px_40px_-12px_rgba(0,0,0,0.7),0_40px_80px_-24px_rgba(0,0,0,0.8)]',
    avatar: 'bg-[#e5e5e5]',
    cursor: '[&_.typed-cursor]:text-[#e5e5e5]',
    readDot: 'bg-[#4ade80]',
    userBubble: 'bg-[#232323]',
    userText: 'text-[#f4f4f5]',
    userLabel: 'text-[#f4f4f5]/40',
    mention: 'text-[#7dd3fc]',
    agentName: 'text-[#fafafa]',
    readLabel: 'text-[#d4d4d8]',
    readPath: 'text-[#d4d4d8]/55',
    body: 'text-[#d4d4d8]',
    bodyStrong: 'text-[#fafafa]',
    actions: 'text-[#d4d4d8]/40',
    actionsHover: 'hover:bg-white/8 hover:text-[#fafafa]',
  },
  {
    name: 'Antigravity',
    icon: '/img/icons/antigravity.svg',
    coloredIcon: true,
    panel: 'bg-[#0f1420]',
    ring: 'ring-1 ring-white/8',
    shadow:
      'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),0_18px_40px_-12px_rgba(0,0,0,0.7),0_40px_80px_-24px_rgba(0,0,0,0.8)]',
    avatar: 'bg-[#38bdf8]',
    cursor: '[&_.typed-cursor]:text-[#38bdf8]',
    readDot: 'bg-[#34d399]',
    userBubble: 'bg-[#1a2234]',
    userText: 'text-[#e2e8f0]',
    userLabel: 'text-[#e2e8f0]/40',
    mention: 'text-[#5eead4]',
    agentName: 'text-[#f8fafc]',
    readLabel: 'text-[#cbd5e1]',
    readPath: 'text-[#cbd5e1]/55',
    body: 'text-[#cbd5e1]',
    bodyStrong: 'text-[#f8fafc]',
    actions: 'text-[#cbd5e1]/40',
    actionsHover: 'hover:bg-white/8 hover:text-[#f8fafc]',
  },
  {
    name: 'opencode',
    icon: '/img/icons/opencode.svg',
    panel: 'bg-[#111111]',
    ring: 'ring-1 ring-white/10',
    shadow:
      'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),0_18px_40px_-12px_rgba(0,0,0,0.7),0_40px_80px_-24px_rgba(0,0,0,0.8)]',
    avatar: 'bg-[#fbbf24]',
    cursor: '[&_.typed-cursor]:text-[#fbbf24]',
    readDot: 'bg-[#4ade80]',
    userBubble: 'bg-[#1f1f1f]',
    userText: 'text-[#f5f5f4]',
    userLabel: 'text-[#f5f5f4]/40',
    mention: 'text-[#fcd34d]',
    agentName: 'text-[#fafaf9]',
    readLabel: 'text-[#e7e5e4]',
    readPath: 'text-[#e7e5e4]/55',
    body: 'text-[#e7e5e4]',
    bodyStrong: 'text-[#fafaf9]',
    actions: 'text-[#e7e5e4]/40',
    actionsHover: 'hover:bg-white/8 hover:text-[#fafaf9]',
  },
];

export const agentThemeAt = (index: number): AgentTheme =>
  AGENT_THEMES[
    ((index % AGENT_THEMES.length) + AGENT_THEMES.length) % AGENT_THEMES.length
  ];
