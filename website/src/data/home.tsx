import type { AgentEntry } from '@site/src/components/AgentsModal';
import type { ComponentType, ReactNode } from 'react';
import {
  LuBadgeCheck,
  LuBlocks,
  LuBookOpen,
  LuBrain,
  LuHeart,
  LuHeartHandshake,
  LuHouse,
  LuLayoutGrid,
  LuListChecks,
  LuPackage,
  LuScanSearch,
  LuShieldCheck,
  LuShieldPlus,
  LuWandSparkles,
} from 'react-icons/lu';
import {
  TbCircleNumber1,
  TbCircleNumber2,
  TbCircleNumber3,
  TbCircleNumber4,
  TbCircleNumber5,
} from 'react-icons/tb';

export type WindowId = 'overview' | 'install' | 'usage';

export type PromptMode = {
  label: string;
  prompt: string;
};

export type Phase = {
  no: string;
  title: string;
  command: string;
  desc: string;
  modes: PromptMode[];
};

export type Group = {
  label: string;
  phases: Phase[];
};

export type Agent = {
  key: string;
  name: string;
  icon: string;
};

export const PHASE_GROUPS: Group[] = [
  {
    label: 'Establish',
    phases: [
      {
        no: 'PHASE 1',
        title: 'Charter',
        command: '/bluespec.charter',
        desc: "Sets your project's security rules, proposed for you or shaped by what you say.",
        modes: [
          {
            label: 'Recommended (Describe)',
            prompt:
              'We run a manga SaaS: authors upload original chapters, readers buy credits with Stripe and spend them to unlock chapters, and authors earn a commission per unlock. Help us preventing users to leak or screenshot it afterwards.',
          },
          {
            label: 'Auto Detect',
            prompt: '',
          },
        ],
      },
    ],
  },
  {
    label: 'Understand',
    phases: [
      {
        no: 'PHASE 2',
        title: 'Detect',
        command: '/bluespec.detect',
        desc: 'Reads your code and maps what your system does and where the risks are.',
        modes: [
          {
            label: 'Recommended (Full)',
            prompt: '',
          },
          {
            label: 'Scoped',
            prompt: "Scan the intern's branch before I merge it.",
          },
          {
            label: 'Targeted',
            prompt: 'Investigate every possible data leak',
          },
        ],
      },
      {
        no: 'PHASE 3',
        title: 'Plan',
        command: '/bluespec.plan',
        desc: 'Turns what detect found into a defense plan, with a fix for each finding.',
        modes: [
          {
            label: 'Recommended (Full)',
            prompt: '',
          },
          {
            label: 'By Severity',
            prompt: 'Only plan the Critical and High findings for now.',
          },
        ],
      },
    ],
  },
  {
    label: 'Defend',
    phases: [
      {
        no: 'PHASE 4',
        title: 'Harden',
        command: '/bluespec.harden',
        desc: 'Applies the plan’s fixes to your code, safely and one at a time.',
        modes: [
          {
            label: 'Recommended (Full)',
            prompt: '',
          },
          {
            label: 'By Severity',
            prompt: 'Apply only the Critical and High fixes for now.',
          },
        ],
      },
      {
        no: 'PHASE 5',
        title: 'Verify',
        command: '/bluespec.verify',
        desc: 'Proves each applied fix holds and closes out the ones that do.',
        modes: [
          {
            label: 'Recommended (Full)',
            prompt: '',
          },
          {
            label: 'By Severity',
            prompt: 'Just verify the Critical and High fixes we applied.',
          },
        ],
      },
    ],
  },
];

export const STEP_ICONS: ComponentType[] = [
  TbCircleNumber1,
  TbCircleNumber2,
  TbCircleNumber3,
  TbCircleNumber4,
  TbCircleNumber5,
];

export const STEP_THEME: ComponentType<{ className?: string }>[] = [
  LuShieldCheck,
  LuScanSearch,
  LuListChecks,
  LuShieldPlus,
  LuBadgeCheck,
];

export const PHASE_STEPS: { phase: Phase; group: string }[] =
  PHASE_GROUPS.flatMap((group) =>
    group.phases.map((phase) => ({
      phase,
      group: group.label,
    }))
  );

export const AGENTS: Agent[] = [
  { key: 'claude', name: 'Claude Code', icon: '/img/icons/claude.svg' },
  { key: 'codex', name: 'Codex CLI', icon: '/img/icons/codex.svg' },
  { key: 'cursor-agent', name: 'Cursor', icon: '/img/icons/cursor.svg' },
  { key: 'agy', name: 'Antigravity', icon: '/img/icons/antigravity.svg' },
  { key: 'opencode', name: 'opencode', icon: '/img/icons/opencode.svg' },
];

export const ALL_AGENTS: AgentEntry[] = [
  { key: 'amazonq', name: 'Amazon Q Developer' },
  { key: 'amp', name: 'Amp' },
  { key: 'agy', name: 'Antigravity' },
  { key: 'auggie', name: 'Auggie CLI' },
  { key: 'claude', name: 'Claude Code' },
  { key: 'cline', name: 'Cline' },
  { key: 'codebuddy', name: 'CodeBuddy CLI' },
  { key: 'codex', name: 'Codex CLI' },
  { key: 'continue', name: 'Continue' },
  { key: 'costrict', name: 'CoStrict' },
  { key: 'crush', name: 'Crush' },
  { key: 'cursor-agent', name: 'Cursor' },
  { key: 'devin', name: 'Devin for Terminal' },
  { key: 'factory', name: 'Factory Droid' },
  { key: 'forge', name: 'Forge' },
  { key: 'gemini', name: 'Gemini CLI' },
  { key: 'copilot', name: 'GitHub Copilot' },
  { key: 'goose', name: 'Goose' },
  { key: 'hermes', name: 'Hermes' },
  { key: 'bob', name: 'IBM Bob' },
  { key: 'iflow', name: 'iFlow CLI' },
  { key: 'junie', name: 'Junie' },
  { key: 'kilocode', name: 'Kilo Code' },
  { key: 'kimi', name: 'Kimi Code' },
  { key: 'kiro-cli', name: 'Kiro CLI' },
  { key: 'lingma', name: 'Lingma' },
  { key: 'vibe', name: 'Mistral Vibe' },
  { key: 'opencode', name: 'opencode' },
  { key: 'pi', name: 'Pi Coding Agent' },
  { key: 'qodercli', name: 'Qoder CLI' },
  { key: 'qwen', name: 'Qwen Code' },
  { key: 'roo', name: 'Roo Code' },
  { key: 'rovodev', name: 'RovoDev ACLI' },
  { key: 'shai', name: 'SHAI (OVHcloud)' },
  { key: 'tabnine', name: 'Tabnine CLI' },
  { key: 'trae', name: 'Trae' },
  { key: 'windsurf', name: 'Windsurf' },
];

export const HIGHLIGHTS: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  lead: ReactNode;
  body: ReactNode;
}[] = [
  {
    Icon: LuShieldCheck,
    title: 'Security-driven by default',
    lead: (
      <>
        A five-phase,{' '}
        <strong className='text-ink font-semibold'>Blue Team-based</strong>{' '}
        flow, ready to run.
      </>
    ),
    body: (
      <>
        It detects what your system actually does, maps the matching attack
        vectors, then drives the security work that fits.
      </>
    ),
  },
  {
    Icon: LuBlocks,
    title: 'Works with any agent',
    lead: (
      <>
        <strong className='text-ink font-semibold'>37 agents</strong> and{' '}
        <strong className='text-ink font-semibold'>any language</strong>: Claude
        Code, Codex, Cursor, Gemini, and more. No lock-in.
      </>
    ),
    body: (
      <>
        Initialize Blue Spec with your agent of choice and it sets up the right
        command files and conventions, ready to run in your project.
      </>
    ),
  },
  {
    Icon: LuBrain,
    title: 'Knowledge on demand',
    lead: (
      <>
        Focused security modules load{' '}
        <strong className='text-ink font-semibold'>
          only for what your project is
        </strong>
        , never a generic flood.
      </>
    ),
    body: (
      <>
        It pulls in the module that fits the context it finds, drawing from a
        catalog that keeps growing as new risks emerge.
      </>
    ),
  },
  {
    Icon: LuWandSparkles,
    title: 'Specializations of your own',
    lead: (
      <>
        Craft{' '}
        <strong className='text-ink font-semibold'>
          unique, authentic specializations
        </strong>{' '}
        shaped to what your project actually needs.
      </>
    ),
    body: (
      <>
        Point it at an article, an exploit, or a topic and it distills a new
        sub-skill into your private catalog, loaded exactly like the built-ins.
      </>
    ),
  },
];

export type RailItem = {
  label: string;
  tip: string;
  active: boolean;
  Icon: ComponentType;
  action?: 'paper' | 'agents' | 'partners';
  href?: string;
};

export const RAILS: Record<'overview' | 'install', RailItem[]> = {
  overview: [
    { label: 'Home', tip: 'Overview', active: true, Icon: LuHouse },
    {
      label: 'What is Security-Driven Hardening',
      tip: 'What is SDH',
      active: false,
      Icon: LuBookOpen,
      action: 'paper',
    },
    {
      label: 'Become a partner',
      tip: 'Become a partner',
      active: false,
      Icon: LuHeartHandshake,
      action: 'partners',
    },
    {
      label: 'Sponsor on GitHub',
      tip: 'Sponsor on GitHub',
      active: false,
      Icon: LuHeart,
      href: 'https://github.com/sponsors/wellwelwel',
    },
  ],
  install: [
    { label: 'Install', tip: 'Install', active: true, Icon: LuPackage },
    {
      label: 'All agents',
      tip: 'All agents',
      active: false,
      Icon: LuLayoutGrid,
      action: 'agents',
    },
  ],
};

export const TABS: { id: WindowId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'install', label: 'Install' },
  { id: 'usage', label: 'How to Use' },
];

export const BACKGROUNDS: Record<WindowId, string> = {
  overview: '/img/bg-1.png',
  install: '/img/bg-2.png',
  usage: '/img/bg-3.png',
};

export const FEATURE: Record<
  WindowId,
  { kicker: ReactNode; chip: string; eyebrow: string; title: ReactNode }
> = {
  overview: {
    kicker: (
      <>
        Blue Spec is the practice of{' '}
        <strong className='text-ink font-semibold'>
          Security-Driven Hardening
        </strong>
        : instead of running a generic checklist, the agent first detects what
        your system does, then drives the fixes that matter for it, governed by
        a spec, framed for defense.
      </>
    ),
    chip: 'Security-Driven Hardening',
    eyebrow: 'The practice',
    title: (
      <>
        Defense
        <br />
        by design
      </>
    ),
  },
  install: {
    kicker: 'Pick your agents, copy one command, you are set.',
    chip: 'Fits your existing flow',
    eyebrow: 'Get started',
    title: (
      <>
        Any Codebase
        <br />
        <span className='text-accent'>37</span> Agents
      </>
    ),
  },
  usage: {
    kicker: 'Point it at your code, let the agent do the work.',
    chip: 'The Blue Team flow',
    eyebrow: 'Blue Team flow',
    title: (
      <>
        Harden
        <br />
        what you ship
      </>
    ),
  },
};

export const monoLabel = 'font-mono text-[11px] tracking-[0.1em] uppercase';
