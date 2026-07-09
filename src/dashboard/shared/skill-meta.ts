import type { SkillGroupKey } from '../../types/core';
import type {
  IconName,
  PromptSpec,
  SkillGroupBadge,
  TypeSegment,
} from '../../types/dashboard/client';
import type { Skill } from '../../types/dashboard/dashboard';
import { SKILLS_CATALOG } from '../../hooks/skills/catalog';
import { SKILL_GROUPS } from '../../hooks/skills/groups';

const SKILL_LABELS: Record<string, string> = {
  'access-control': 'Access Control',
  'api-endpoint': 'API Endpoint',
  browser: 'Browser',
  'c-cpp': 'C / C++',
  container: 'Container',
  'credential-endpoint': 'Credential Endpoint',
  crypto: 'Crypto',
  csv: 'CSV',
  dotnet: '.NET',
  federation: 'Federation',
  go: 'Go',
  'http-request': 'HTTP Request',
  interpreter: 'Interpreter',
  java: 'Java',
  javascript: 'JavaScript',
  llm: 'LLM',
  network: 'Network',
  path: 'Path',
  payment: 'Payment',
  php: 'PHP',
  python: 'Python',
  regex: 'Regex',
  ruby: 'Ruby',
  rust: 'Rust',
  serverless: 'Serverless',
  supabase: 'Supabase',
  transport: 'Transport',
  upload: 'Upload',
  xml: 'XML',
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'access-control':
    "Makes sure people can only see and do what they are allowed to, so no one can reach another user's data or admin-only actions just by changing a link or an ID.",
  'api-endpoint':
    "Checks the doors your app exposes to the outside world, so requests from strangers can't pull private data or trigger actions they shouldn't.",
  browser:
    "Guards what runs in your visitors' browsers, so an attacker can't inject code that steals logins or hijacks what your users see and click.",
  'c-cpp':
    'Catches low-level memory mistakes that let attackers crash the program or run their own code on your server.',
  container:
    'Reviews how your app is packaged and deployed, so a break-in stays contained instead of handing an attacker the whole machine.',
  'credential-endpoint':
    "Protects the login, signup, and password-reset flows, so attackers can't guess passwords, take over accounts, or reset someone else's.",
  crypto:
    "Makes sure sensitive data is scrambled properly, so passwords, tokens, and personal info can't be read even if they leak.",
  csv: "Keeps exported spreadsheets safe, so opening a downloaded file can't quietly run a harmful command on someone's computer.",
  dotnet:
    'Covers security pitfalls specific to .NET apps that can let an attacker run their own code on your server.',
  federation:
    "Secures “sign in with Google/Microsoft/etc.” so an attacker can't impersonate a user or slip into an account that isn't theirs.",
  go: 'Covers security pitfalls specific to Go apps, especially subtle bugs that show up under real traffic.',
  'http-request':
    "Inspects the data that arrives with each web request, so hidden or malicious input can't bend your app into doing the wrong thing.",
  interpreter:
    "Stops user input from being run as commands, so a form field or upload can't make your server execute an attacker's instructions.",
  java: 'Covers security pitfalls specific to Java apps that can let an attacker run their own code on your server.',
  javascript:
    "Covers security pitfalls specific to JavaScript and Node apps, from running untrusted code to reading files it shouldn't.",
  llm: "Protects features built on AI models, so a cleverly worded message can't trick the AI into leaking data or misusing connected tools.",
  network:
    "Checks how your app talks to other services, so it can't be tricked into fetching or trusting something an attacker controls.",
  path: "Prevents attackers from wandering your server's files, so they can't read private files or overwrite important ones by manipulating a filename.",
  payment:
    'Secures checkout and billing, so no one can tamper with prices, dodge payment, or replay a charge.',
  php: 'Covers security pitfalls specific to PHP apps that can let an attacker run their own code or bypass a login.',
  python:
    "Covers security pitfalls specific to Python apps, especially loading untrusted data that can run an attacker's code.",
  regex:
    "Makes sure text checks are safe and efficient, so a malicious input can't freeze your app by overloading it.",
  ruby: "Covers security pitfalls specific to Ruby apps, especially loading untrusted data that can run an attacker's code.",
  rust: 'Covers security pitfalls specific to Rust apps, especially unsafe code that can corrupt memory or crash the program.',
  serverless:
    "Reviews cloud functions and their permissions, so a single function can't be abused to reach far more than it should.",
  supabase:
    "Locks down your Supabase backend, so your database rules actually hold and secret keys don't end up exposed to the public.",
  transport:
    "Makes sure data travels over a secure, encrypted connection, so it can't be read or altered on the way between your users and your app.",
  upload:
    "Keeps file uploads safe, so someone can't upload a disguised file that runs code, overwrites data, or fills up your storage.",
  xml: "Secures how your app reads XML data, so a crafted file can't leak server files or knock your app offline.",
};

const SKILL_PROMPT_TASKS: Record<string, string> = {
  regex: 'Add a coupon field to checkout that only accepts valid codes',
  javascript: 'Build a web app with JavaScript',
  browser: "Show each user's bio on their public profile page",
  network: 'Let users paste a link and show a little preview of it',
  interpreter:
    'Add a field where people can write their own formulas, like in an Excel spreadsheet',
  path: 'Let people download their files by clicking on them',
  upload: 'Let people upload a profile photo in account settings',
  'access-control': 'Add an admin area to manage all the user accounts',
  'credential-endpoint': 'Build sign up, login, and forgot-password for my app',
  federation: 'Add a “Continue with Google” button to my login page',
  'http-request': 'Let users update their email from their profile page',
  transport: 'Make my whole site load securely over https',
  crypto: 'Let people create an account with a password and log back in',
  'api-endpoint': 'Build an API so my mobile app can talk to the backend',
  payment: 'Add Stripe checkout so customers can pay on the pricing page',
  xml: 'Let suppliers upload their invoices as XML files',
  csv: 'Add a button to export my contacts to a spreadsheet',
  container: 'Package my app so I can deploy it to the cloud',
  serverless: 'Automatically make a thumbnail whenever someone uploads a photo',
  llm: 'Add a chatbot that answers questions from my help docs',
  supabase: 'Set up Supabase so each user only sees their own notes',
  python: 'Build a data tool with Python',
  rust: 'Build a fast service with Rust',
  java: 'Build a backend with Java',
  ruby: 'Build a web app with Ruby',
  php: 'Build a website with PHP',
  go: 'Build an API service with Go',
  'c-cpp': 'Build a native program with C++',
  dotnet: 'Build a desktop app with .NET',
};

const GROUP_ICONS: Record<SkillGroupKey, string> = {
  owasp: 'owasp',
  infra: 'kubernetes',
  ai: 'ai',
  lovable: 'lovable',
  javascript: 'javascript',
  python: 'python',
  rust: 'rust',
  java: 'java',
  ruby: 'ruby',
  php: 'php',
  go: 'go',
  'c-cpp': 'cpp',
  dotnet: 'dot-net',
};

const SKILL_ICON: Record<string, IconName> = {
  upload: 'upload',
  path: 'file',
  interpreter: 'terminal',
  network: 'globe',
  javascript: 'code',
  regex: 'code',
  crypto: 'key',
  'access-control': 'key',
  'credential-endpoint': 'key',
  'api-endpoint': 'globe',
  'http-request': 'globe',
  browser: 'globe',
  container: 'layers',
  serverless: 'activity',
  transport: 'globe',
  federation: 'key',
  payment: 'key',
  csv: 'file',
  xml: 'file',
  python: 'code',
  rust: 'code',
  java: 'code',
  ruby: 'code',
  php: 'code',
  go: 'code',
  'c-cpp': 'code',
  dotnet: 'code',
  llm: 'cpu',
  supabase: 'layers',
};

const titleCase = (slug: string): string =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const skillGroupIcon = (key: SkillGroupKey): string =>
  `/assets/icons/${GROUP_ICONS[key]}.svg`;

export const catalogSkillNames = (): string[] =>
  SKILLS_CATALOG.map((entry) => entry.name);

export const skillLabel = (name: string): string =>
  SKILL_LABELS[name] ?? titleCase(name);

export const skillIconName = (name: string): IconName =>
  SKILL_ICON[name] ?? 'brain';

export const skillDescription = (name: string): string =>
  SKILL_DESCRIPTIONS[name] ??
  'Adds focused security checks for this part of your project.';

export const skillPromptTask = (name: string): string =>
  SKILL_PROMPT_TASKS[name] ?? `Add a feature that touches ${skillLabel(name)}`;

export const AGENT_REPLY: TypeSegment[] = [{ text: 'On it!' }];

export const skillPromptSpec = (skill: Skill): PromptSpec => ({
  task: `${skillPromptTask(skill.name)}.`,
  mention: `@.lagune/skills/${skill.name}.md`,
  readPath: `${skill.name}.md`,
  reply: AGENT_REPLY,
});

export const skillGroups = (name: string): SkillGroupBadge[] => {
  const keys = SKILLS_CATALOG.find((entry) => entry.name === name)?.groups;

  return (keys ?? [])
    .map((key) => SKILL_GROUPS.find((group) => group.key === key))
    .filter((group) => group !== undefined)
    .map((group) => ({
      key: group.key,
      label: group.label,
      icon: skillGroupIcon(group.key),
    }));
};
