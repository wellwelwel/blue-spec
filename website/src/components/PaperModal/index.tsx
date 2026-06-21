import type { MDXComponents } from 'mdx/types';
import type { ReactElement, ReactNode } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { Mermaid } from '@site/src/components/Mermaid';
import Paper from '@site/src/content/PAPER.mdx';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';

/*
 * The paper cross-references itself two ways: citations `[n]` (to the
 * "## References" section) and section anchors `§N` (to a "## N. ..." heading).
 * Both are read from the rendered document, so they always match exactly, and
 * both render the same pill that reveals the target in a popover on hover.
 */
type RefMaps = {
  references: Map<string, string>;
  sections: Map<string, string>;
};

const RefContext = createContext<RefMaps>({
  references: new Map(),
  sections: new Map(),
});

const CITATION = /^\[(\d+)\]$/;
const SECTION = /^§([IVXLC]+)$/;

const RefPopover = ({
  label,
  eyebrow,
  content,
}: {
  label: string;
  eyebrow: string;
  content: string;
}): ReactNode => {
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ left: rect.left + rect.width / 2, top: rect.top });
  }, [open]);

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
        className='inline-block px-1.5 py-0.5 rounded-md bg-accent/15 font-mono text-[0.86em] text-[#5fb4ff] whitespace-nowrap cursor-help transition-colors hover:bg-accent/25 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1'
      >
        {label}
      </span>
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role='tooltip'
            className='bs-cite-pop fixed z-[110] block w-[min(420px,calc(100vw-32px))] -mt-2.5 p-3.5 rounded-xl border border-white/12 bg-[#10162a] text-[12.5px] leading-[1.55] text-[rgba(233, 237, 247,0.86)] [box-shadow:0_20px_60px_-15px_rgba(0,0,0,0.85)]'
            style={{ left: pos.left, top: pos.top }}
          >
            <span className='block mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-[#5fb4ff]'>
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
  if (!reference) {
    return (
      <code className='px-1.5 py-0.5 rounded-md bg-white/[0.07] font-mono text-[0.86em] text-ink'>
        [{index}]
      </code>
    );
  }
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
  if (!title) {
    return (
      <span className='font-medium text-[#5fb4ff] whitespace-nowrap'>
        §{roman}
      </span>
    );
  }
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

const Pre = ({ children }: { children?: ReactNode }): ReactNode => {
  const code = Children.toArray(children).find(
    (
      child
    ): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child)
  );
  const isMermaid = (code?.props.className ?? '').includes('language-mermaid');

  if (isMermaid) {
    return <Mermaid chart={extractText(code?.props.children)} />;
  }

  return (
    <pre className='my-5 p-4 rounded-xl border border-line bg-[rgba(6,7,9,0.6)] overflow-x-auto font-mono text-[12.5px] leading-[1.5] text-[rgba(233, 237, 247,0.86)] [&>code]:p-0 [&>code]:bg-transparent [&>code]:text-inherit'>
      {children}
    </pre>
  );
};

const P = ({ children }: { children?: ReactNode }) => (
  <p className='my-4 text-[14.5px] leading-[1.7] text-[rgba(233, 237, 247,0.82)]'>
    {children}
  </p>
);

const Strong = ({ children }: { children?: ReactNode }) => (
  <strong className='font-semibold text-ink'>{children}</strong>
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
    return (
      <blockquote className='my-5 pl-4 border-l-2 border-accent/50 text-[rgba(233, 237, 247,0.72)] [&>p]:my-2 [&>p]:italic'>
        {children}
      </blockquote>
    );
  }

  const body = items.filter((item) => item !== first);

  return (
    <div className='my-6 rounded-xl border border-accent/30 bg-accent/[0.06] overflow-hidden'>
      <div className='px-4 py-2.5 border-b border-accent/25 bg-accent/[0.1] font-display font-bold text-[14px] tracking-[-0.01em] text-ink'>
        {titleNode.props.children}
      </div>
      <div className='px-4 py-3.5 text-[14px] leading-[1.65] text-[rgba(233, 237, 247,0.82)] [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>ul]:my-2'>
        {body}
      </div>
    </div>
  );
};

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className='mt-0 mb-5 font-display font-bold text-[clamp(24px,3.4vw,28px)] leading-[1.15] tracking-[-0.02em] text-ink'>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className='mt-7 mb-4 font-display font-bold text-[clamp(20px,2.4vw,27px)] leading-[1.2] tracking-[-0.02em] text-ink'>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className='mt-8 mb-3 text-[17px] font-semibold tracking-[-0.01em] text-ink'>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className='mt-6 mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[rgba(233, 237, 247,0.92)]'>
      {children}
    </h4>
  ),
  p: P,
  a: ({ href, children }) => (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      className='text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent'
    >
      {children}
    </a>
  ),
  strong: Strong,
  em: ({ children }) => <em className='italic'>{children}</em>,
  ul: ({ children }) => (
    <ul className='my-4 pl-5 list-disc marker:text-faint text-[14.5px] leading-[1.7] text-[rgba(233, 237, 247,0.82)] [&_ul]:my-1.5'>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className='my-4 pl-5 list-decimal marker:text-faint text-[14.5px] leading-[1.7] text-[rgba(233, 237, 247,0.82)]'>
      {children}
    </ol>
  ),
  li: ({ children }) => <li className='my-1.5 pl-1'>{children}</li>,
  blockquote: ({ children }) => <Callout>{children}</Callout>,
  hr: () => <hr className='my-9 border-0 border-t border-[#042847]' />,
  code: ({ className, children }) => {
    const isBlock = (className ?? '').includes('language-');
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }

    const text = typeof children === 'string' ? children : '';
    const citation = text.match(CITATION);
    if (citation) {
      return <CitationRef index={citation[1]} />;
    }

    const section = text.match(SECTION);
    if (section) {
      return <SectionRef roman={section[1]} />;
    }

    return (
      <code className='px-1.5 py-0.5 rounded-md bg-white/[0.07] font-mono text-[0.86em] text-ink'>
        {children}
      </code>
    );
  },
  pre: Pre,
  table: ({ children }) => (
    <div className='my-6 overflow-x-auto rounded-xl border border-line'>
      <table className='w-full border-collapse text-[13px] text-left'>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className='bg-white/[0.04]'>{children}</thead>
  ),
  th: ({ children }) => (
    <th className='px-3.5 py-2.5 border-b border-line font-semibold text-ink align-middle'>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className='px-3.5 py-2.5 border-b border-line align-middle text-[rgba(233, 237, 247,0.8)] [&_code]:whitespace-nowrap'>
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className='last:[&>td]:border-b-0'>{children}</tr>,
};

export const PaperModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactNode => {
  const panelRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [refs, setRefs] = useState<RefMaps>({
    references: new Map(),
    sections: new Map(),
  });

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !paperRef.current) return;

    const references = new Map<string, string>();
    for (const p of paperRef.current.querySelectorAll('p')) {
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
    for (const h of paperRef.current.querySelectorAll('h2')) {
      const title = (h.textContent ?? '').trim();
      const match = title.match(/^([IVXLC]+)\.\s/);
      if (match) sections.set(match[1], title);
    }

    setRefs({ references, sections });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className='bs-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-[clamp(12px,4vw,48px)] bg-[rgba(2,4,12,0.72)] [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]'
      onClick={onClose}
      role='presentation'
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='Security-Driven Hardening paper'
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className='bs-modal-panel relative flex flex-col w-full max-w-[920px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
      >
        <div className='flex items-center justify-between gap-4 shrink-0 px-[clamp(20px,3vw,32px)] py-4 border-b border-[#0c155c] bg-[#0a0f1f]'>
          <span className='font-mono text-[11px] tracking-[0.14em] uppercase text-muted'>
            The Concept
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='relative inline-flex items-center justify-center size-9 -mr-1.5 rounded-full text-muted cursor-pointer transition-[color,background-color] duration-200 ease-out hover:bg-white/[0.08] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[18px]'
          >
            <LuX />
          </button>
        </div>

        <div
          ref={paperRef}
          className='bs-paper grow overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,30px)]'
        >
          <RefContext.Provider value={refs}>
            <MDXProvider components={components}>
              <Paper />
            </MDXProvider>
          </RefContext.Provider>
        </div>
      </div>
    </div>
  );
};
