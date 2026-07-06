import type { ReactNode } from 'react';
import type { AgentTheme, CatalogSkill } from './data';
import { MaskIcon } from '@site/src/components/MaskIcon';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactTyped } from 'react-typed';
import { Icon } from '../icons';
import { agentThemeAt, skillsCatalog } from './data';

/* The global .font-mono rule (custom.css) carries the landing page's weight
   and size, so the mono bits here set the family directly. */
const MONO = "[font-family:'Fira_Code',ui-monospace,'SF_Mono',Menlo,monospace]";

const EASE = 'ease-[cubic-bezier(0.2,0,0,1)]';

type Anchor = { right: number; bottom: number };

const HoverPopover = ({
  trigger,
  children,
  width,
  triggerClassName,
  panelClassName,
}: {
  trigger: ReactNode;
  children: (open: boolean) => ReactNode;
  width: number;
  triggerClassName?: string;
  panelClassName?: string;
}): ReactNode => {
  const ref = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const lastPointerType = useRef<string>('');
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!hovered || open) return;
    void panelRef.current?.offsetWidth;
    setOpen(true);
  }, [hovered, open]);

  const measure = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const panelWidth = Math.min(width, window.innerWidth - 24);
      setAnchor({
        right: Math.max(
          Math.min(
            window.innerWidth - rect.right,
            window.innerWidth - 12 - panelWidth
          ),
          12
        ),
        bottom: window.innerHeight - rect.top + 10,
      });
    }
  };

  const show = () => {
    measure();
    setHovered(true);
  };

  const hide = () => {
    setHovered(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!hovered) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      hide();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [hovered]);

  useEffect(() => {
    if (!hovered) return;
    const reposition = () => measure();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [hovered]);

  return (
    <span
      ref={ref}
      className={triggerClassName}
      onPointerDown={(event) => {
        lastPointerType.current = event.pointerType;
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') hide();
      }}
      onClick={() => {
        if (lastPointerType.current === 'mouse') {
          return;
        }
        hovered ? hide() : show();
      }}
    >
      {trigger}
      {anchor !== null &&
        createPortal(
          <span
            ref={panelRef}
            data-open={open ? 'true' : 'false'}
            className={clsx(
              'group/pop pointer-events-none fixed z-120 origin-bottom-right font-jakarta antialiased transition-[opacity,scale,translate] duration-200 will-change-transform',
              EASE,
              panelClassName,
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-1.5 scale-95 opacity-0'
            )}
            style={{
              right: `${anchor.right}px`,
              bottom: `${anchor.bottom}px`,
              width: `min(${width}px, calc(100vw - 24px))`,
            }}
          >
            {children(open)}
          </span>,
          document.body
        )}
    </span>
  );
};

const GLYPH = `col-start-1 row-start-1 inline-flex transition-[opacity,scale,filter] duration-300 ${EASE}`;

const CopyButton = ({
  text,
  label,
}: {
  text: string;
  label: string;
}): ReactNode => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };

  return (
    <button
      type='button'
      aria-label={copied ? 'Copied' : label}
      onClick={copy}
      className='grid size-10 flex-none cursor-pointer place-items-center rounded-field border-0 bg-transparent text-[0.95rem] text-faint transition-colors hover:text-accent'
    >
      <span className='grid'>
        <span
          className={clsx(
            GLYPH,
            copied
              ? 'scale-[0.25] opacity-0 blur-[4px]'
              : 'scale-100 opacity-100 blur-0'
          )}
        >
          <Icon name='copy' />
        </span>
        <span
          className={clsx(
            GLYPH,
            'text-teal',
            copied
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-[0.25] opacity-0 blur-[4px]'
          )}
        >
          <Icon name='check' />
        </span>
      </span>
    </button>
  );
};

const REPLY_ACTIONS = [
  'copy',
  'play',
  'thumbsUp',
  'thumbsDown',
  'refresh',
] as const;

const AgentReply = ({
  skill,
  theme,
  open,
}: {
  skill: CatalogSkill;
  theme: AgentTheme;
  open: boolean;
}): ReactNode => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) setDone(false);
  }, [open]);

  return (
    <span
      className={`flex translate-y-1 items-start gap-2.5 opacity-0 transition-[opacity,translate] delay-150 duration-300 ${EASE} group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100`}
    >
      {theme.coloredIcon ? (
        <img src={theme.icon} alt='' className='mt-0.5 size-5 flex-none' />
      ) : (
        <MaskIcon
          src={theme.icon}
          className={clsx('mt-0.5 size-5 flex-none', theme.avatar)}
        />
      )}
      <span className='flex min-w-0 flex-col items-start'>
        <span className={clsx('text-[0.74rem] font-bold', theme.agentName)}>
          {theme.name}
        </span>
        <span
          className={`mt-2 flex translate-y-1 items-center gap-2 opacity-0 transition-[opacity,translate] delay-300 duration-300 ${EASE} group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100`}
        >
          <span
            className={clsx('size-2 flex-none rounded-full', theme.readDot)}
          />
          <span className={clsx('text-[0.74rem] font-bold', theme.readLabel)}>
            Read
          </span>
          <span
            className={clsx('truncate text-[0.72rem]', MONO, theme.readPath)}
          >
            {skill.name}.md
          </span>
        </span>
        <span
          className={clsx(
            'mt-3 text-left text-[0.78rem] leading-relaxed',
            theme.body,
            theme.cursor,
            done && '[&_.typed-cursor]:hidden'
          )}
        >
          {open && (
            <ReactTyped
              strings={[`On it!`]}
              typeSpeed={45}
              startDelay={620}
              showCursor
              cursorChar='▍'
              loop={false}
              onComplete={() => setDone(true)}
            />
          )}
        </span>
        <span
          className={clsx(
            'mt-3 flex items-center gap-0.5 transition-opacity duration-200',
            theme.actions,
            done ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          {REPLY_ACTIONS.map((action) => (
            <span
              key={action}
              className={clsx(
                'grid size-6 place-items-center rounded-field text-[0.82rem] transition-colors',
                theme.actionsHover
              )}
            >
              <Icon name={action} />
            </span>
          ))}
        </span>
      </span>
    </span>
  );
};

const PromptPreview = ({
  skill,
  seed,
}: {
  skill: CatalogSkill;
  seed: number;
}): ReactNode => {
  const theme = agentThemeAt(seed);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: none)');
    const update = () => setIsTouch(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <HoverPopover
      width={344}
      triggerClassName='group/eg relative inline-flex'
      panelClassName={clsx(
        'overflow-hidden rounded-[15px]',
        theme.panel,
        theme.ring,
        theme.shadow
      )}
      trigger={
        <span className='inline-flex h-8 cursor-help items-center gap-1.5'>
          <span className='bs-robot-hop inline-flex text-[1.5rem]'>
            <Icon name='messageAi' />
          </span>
          <span className='relative rounded-chip border border-line-2 bg-surface-2 px-3 py-1 text-[.9rem]! font-mono font-extrabold text-gray-800 transition-colors before:absolute before:top-1/2 before:-left-1 before:size-2.5 before:-translate-y-1/2 before:rotate-45 before:rounded-[2px] before:border-b before:border-l before:border-line-2 before:bg-surface-2 before:transition-colors docs-dark:text-white group-hover/eg:bg-accent-soft group-hover/eg:text-accent group-hover/eg:before:bg-accent-soft'>
            {isTouch ? 'Touch me!' : 'Hover me!'}
          </span>
        </span>
      }
    >
      {(open) => (
        <>
          <span className='flex gap-1.5 px-4 pt-3.5 pb-1'>
            <span className='size-3 rounded-full bg-[#ff5f57]' />
            <span className='size-3 rounded-full bg-[#febc2e]' />
            <span className='size-3 rounded-full bg-[#28c840]' />
          </span>
          <span className='flex flex-col gap-4 px-6 pt-3 pb-6'>
            <span
              className={`flex translate-y-1 flex-col items-end gap-1 opacity-0 transition-[opacity,translate] duration-300 ${EASE} group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100`}
            >
              <span
                className={clsx(
                  'flex max-w-[86%] flex-col gap-1.5 rounded-card rounded-br-[3px] px-3.5 py-2.5 text-left text-[0.78rem] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_10px_-6px_rgba(0,0,0,0.5)]',
                  theme.userBubble,
                  theme.userText
                )}
              >
                <span>{skill.promptTask}.</span>
                <span>
                  Use{' '}
                  <span className={clsx('font-bold', theme.mention)}>
                    @.bluespec/skills/{skill.name}.md
                  </span>
                </span>
              </span>
              <span
                className={clsx(
                  'pr-1 text-[0.62rem] font-semibold tabular-nums',
                  theme.userLabel
                )}
              >
                You
              </span>
            </span>
            <AgentReply skill={skill} theme={theme} open={open} />
          </span>
        </>
      )}
    </HoverPopover>
  );
};

const SkillCard = ({
  skill,
  seed,
}: {
  skill: CatalogSkill;
  seed: number;
}): ReactNode => (
  <article className='group/card flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card'>
    <header className='flex items-center gap-3 p-4.5 pb-3.5'>
      <span className='grid size-11 flex-none place-items-center rounded-field bg-accent-soft text-[1.25rem] text-accent ring-1 ring-line-2 ring-offset-2 ring-offset-surface'>
        <Icon name={skill.icon} />
      </span>
      <h3 className='m-0 min-w-0 flex-1 truncate font-jakarta text-[0.9rem] font-bold text-ink-2'>
        {skill.label}
      </h3>
    </header>
    <p className='m-0 px-4.5 text-[0.82rem] leading-normal text-muted'>
      {skill.description}
    </p>
    <div className='flex flex-1 items-end justify-between gap-3 px-4.5 pt-3 pb-4.5'>
      <div className='flex flex-wrap content-end items-end gap-1.5'>
        {skill.groups.map((group) => (
          <span
            key={group.label}
            className='group/chip relative grid size-8 place-items-center rounded-chip bg-accent-soft text-faint'
          >
            <MaskIcon
              src={`/img/icons/${group.icon}.svg`}
              className='size-4 bg-accent'
            />
            <span
              className={`pointer-events-none absolute bottom-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-chip bg-dark px-2 py-1 text-[0.68rem] font-bold text-white opacity-0 transition-[opacity,scale,translate] duration-200 ${EASE} group-hover/chip:translate-y-0 group-hover/chip:scale-100 group-hover/chip:opacity-100`}
            >
              {group.label}
            </span>
          </span>
        ))}
      </div>
      <PromptPreview skill={skill} seed={seed} />
    </div>
    <div className='flex flex-col gap-1 border-t border-line bg-surface-2 px-4.5 py-0.5'>
      <div className='flex items-center gap-2'>
        <span className='inline-flex flex-none text-[0.9rem] text-faint'>
          <Icon name='messageAi' />
        </span>
        <code
          className={clsx(
            'min-w-0 flex-1 truncate border-0! bg-transparent p-0! text-[0.72rem] font-semibold text-[#6b737a]!',
            MONO
          )}
        >
          @.bluespec/skills/{skill.name}.md
        </code>
        <CopyButton
          text={`@.bluespec/skills/${skill.name}.md`}
          label={`Copy path for ${skill.label}`}
        />
      </div>
    </div>
  </article>
);

export const SkillsOverview = (): ReactNode => (
  <div className='grid grid-cols-1 gap-4 font-jakarta leading-normal md:grid-cols-2 min-[1600px]:grid-cols-3'>
    {skillsCatalog.map((skill, index) => (
      <SkillCard key={skill.name} skill={skill} seed={index} />
    ))}
  </div>
);
