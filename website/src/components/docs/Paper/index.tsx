import type { MDXComponents } from 'mdx/types';
import type { ReactElement, ReactNode } from 'react';
import type { DocsTheme } from '../useDocsTheme';
import { MDXProvider } from '@mdx-js/react';
import PaperContent from '@site/src/content/PAPER.mdx';
import CodeBlock from '@theme/CodeBlock';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Mermaid } from '../Mermaid';
import { useDocsTheme } from '../useDocsTheme';

/*
 * The paper cross-references itself two ways: citations `[n]` (to the
 * "## References" section) and section anchors `§N` (to a "## N. ..." heading).
 * Both are read from the rendered document, so they always match exactly, and
 * both render the same pill that reveals its target in a popover on hover.
 */
type RefMaps = {
  references: Map<string, string>;
  sections: Map<string, string>;
  theme: DocsTheme;
};

const RefContext = createContext<RefMaps>({
  references: new Map(),
  sections: new Map(),
  theme: 'light',
});

const CITATION = /^\[(\d+)\]$/;
const SECTION = /^§([IVXLC]+)$/;

/* The popover is portaled to <body>, outside the .lagune-docs token scope, so its
   two-color surface is resolved per mode here instead of from CSS variables. */
const POPOVER_THEME: Record<
  DocsTheme,
  { bg: string; border: string; ink: string; eyebrow: string; shadow: string }
> = {
  light: {
    bg: '#ffffff',
    border: '#e2e6ef',
    ink: '#3d4058',
    eyebrow: '#005eff',
    shadow:
      '0 2px 6px -3px rgba(18,22,45,0.1), 0 12px 28px -12px rgba(18,22,45,0.24)',
  },
  dark: {
    bg: '#1d2432',
    border: '#2d3648',
    ink: '#c6ccdb',
    eyebrow: '#4f9bff',
    shadow:
      '0 2px 8px -4px rgba(0,0,0,0.6), 0 14px 30px -14px rgba(0,0,0,0.75)',
  },
};

const pillClass =
  'inline-block rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[0.86em] whitespace-nowrap text-accent';

const StaticPill = ({ label }: { label: string }): ReactNode => (
  <span className={pillClass}>{label}</span>
);

const RefPopover = ({
  label,
  eyebrow,
  content,
}: {
  label: string;
  eyebrow: string;
  content: string;
}): ReactNode => {
  const { theme } = useContext(RefContext);
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const half = Math.min(420, window.innerWidth - 32) / 2;
    const center = rect.left + rect.width / 2;
    setPos({
      left: Math.min(
        Math.max(center, half + 12),
        window.innerWidth - half - 12
      ),
      top: rect.top,
    });
  }, [open]);

  const palette = POPOVER_THEME[theme];

  return (
    <span
      className='relative inline-block'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        ref={triggerRef}
        tabIndex={0}
        role='button'
        aria-label={eyebrow}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`${pillClass} cursor-help transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent`}
      >
        {label}
      </span>
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role='tooltip'
            className='lagune-cite-pop fixed z-[110] -mt-2.5 block w-[min(420px,calc(100vw-32px))] rounded-xl border p-3.5 text-[12.5px] leading-[1.55]'
            style={{
              left: pos.left,
              top: pos.top,
              background: palette.bg,
              borderColor: palette.border,
              color: palette.ink,
              boxShadow: palette.shadow,
            }}
          >
            <span
              className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em]'
              style={{ color: palette.eyebrow }}
            >
              {eyebrow}
            </span>
            {content}
          </span>,
          document.body
        )}
    </span>
  );
};

const CitationRef = ({ index }: { index: string }): ReactNode => {
  const reference = useContext(RefContext).references.get(index);
  if (!reference) return <StaticPill label={`[${index}]`} />;
  return (
    <RefPopover
      label={`[${index}]`}
      eyebrow={`Reference [${index}]`}
      content={reference}
    />
  );
};

const SectionRef = ({ roman }: { roman: string }): ReactNode => {
  const title = useContext(RefContext).sections.get(roman);
  if (!title) return <StaticPill label={`§${roman}`} />;
  return (
    <RefPopover
      label={`§${roman}`}
      eyebrow={`Section ${roman}`}
      content={title}
    />
  );
};

const extractText = (node: ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
};

/* Fenced blocks are either a Mermaid diagram or ordinary code; the latter keeps
   the docs' own CodeBlock so it reads like every other snippet in the docs. */
const Pre = ({ children }: { children?: ReactNode }): ReactNode => {
  const { theme } = useContext(RefContext);
  const code = Children.toArray(children).find(
    (
      child
    ): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child)
  );
  const className = code?.props.className ?? '';
  const text = extractText(code?.props.children);

  if (className.includes('language-mermaid')) {
    return <Mermaid chart={text} theme={theme} />;
  }

  return (
    <CodeBlock language={/language-(\w+)/.exec(className)?.[1]}>
      {text}
    </CodeBlock>
  );
};

/* Passthroughs to native elements: the docs markdown skin styles them, and they
   give Callout a stable identity to detect the paper's titled callout boxes. */
const P = ({ children }: { children?: ReactNode }): ReactNode => (
  <p>{children}</p>
);
const Strong = ({ children }: { children?: ReactNode }): ReactNode => (
  <strong>{children}</strong>
);

/*
 * Several blockquotes in the paper are IEEE-style callout boxes: a lone bold
 * label on its own line, then the body. Render those as a titled box. Any other
 * blockquote keeps the plain quoted style. The text is never altered.
 */
const Callout = ({ children }: { children: ReactNode }): ReactNode => {
  const items = Children.toArray(children);
  const first = items.find(
    (item): item is ReactElement<{ children?: ReactNode }> =>
      isValidElement(item) && item.type === P
  );
  const firstInner = first ? Children.toArray(first.props.children) : [];
  const titleNode = firstInner[0];
  const titled =
    firstInner.length === 1 &&
    isValidElement<{ children?: ReactNode }>(titleNode) &&
    titleNode.type === Strong;

  if (
    !titled ||
    !first ||
    !isValidElement<{ children?: ReactNode }>(titleNode)
  ) {
    return <blockquote>{children}</blockquote>;
  }

  const body = items.filter((item) => item !== first);

  return (
    <div className='my-6 overflow-hidden rounded-panel border border-accent/30 bg-accent-soft'>
      <div className='border-b border-accent/25 bg-accent/10 px-4 py-2.5 font-jakarta text-[14px] font-bold tracking-[-0.01em] text-ink'>
        {titleNode.props.children}
      </div>
      <div className='lagune-callout-body px-4 py-3.5'>{body}</div>
    </div>
  );
};

const components: MDXComponents = {
  h1: () => null,
  p: P,
  strong: Strong,
  blockquote: ({ children }) => <Callout>{children}</Callout>,
  pre: Pre,
  code: ({ className, children }) => {
    if ((className ?? '').includes('language-')) {
      return <code className={className}>{children}</code>;
    }

    const text = typeof children === 'string' ? children : '';
    const citation = text.match(CITATION);
    if (citation) return <CitationRef index={citation[1]} />;

    const section = text.match(SECTION);
    if (section) return <SectionRef roman={section[1]} />;

    return <code>{children}</code>;
  },
};

export const Paper = (): ReactNode => {
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = useDocsTheme();
  const [maps, setMaps] = useState<{
    references: Map<string, string>;
    sections: Map<string, string>;
  }>({ references: new Map(), sections: new Map() });

  const content = useMemo(() => <PaperContent />, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const references = new Map<string, string>();

    for (const p of root.querySelectorAll('p')) {
      const label = p.querySelector('strong');
      if (!label) continue;

      const match = label.textContent?.match(CITATION);
      if (!match) continue;

      const body = (p.textContent ?? '')
        .replace(label.textContent ?? '', '')
        .trim();

      references.set(match[1], body);
    }

    const sections = new Map<string, string>();

    for (const h of root.querySelectorAll('h2')) {
      const title = (h.textContent ?? '').replace(/\u200b/g, '').trim();
      const match = title.match(/^([IVXLC]+)\.\s/);

      if (match) sections.set(match[1], title);
    }

    setMaps({ references, sections });
  }, []);

  const value = useMemo<RefMaps>(
    () => ({ references: maps.references, sections: maps.sections, theme }),
    [maps, theme]
  );

  return (
    <div ref={rootRef}>
      <RefContext.Provider value={value}>
        <MDXProvider components={components}>{content}</MDXProvider>
      </RefContext.Provider>
    </div>
  );
};
