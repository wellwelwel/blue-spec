import type { ReactNode } from 'react';
import type { DocsTheme } from '../useDocsTheme';
import { useEffect, useId, useRef, useState } from 'react';

/*
 * Mermaid draws to its own SVG, outside the docs stylesheet, so the palette is
 * handed in per mode instead of read from CSS variables. Each entry mirrors the
 * docs tokens (surface, ink, accent, line) for that theme.
 */
const THEME_VARIABLES: Record<DocsTheme, Record<string, string>> = {
  light: {
    background: 'transparent',
    primaryColor: 'rgba(0,94,255,0.10)',
    primaryBorderColor: 'rgba(0,94,255,0.55)',
    primaryTextColor: '#17182b',
    lineColor: 'rgba(23,24,43,0.42)',
    textColor: '#3d4058',
    fontSize: '13px',
    edgeLabelBackground: '#ffffff',
    tertiaryColor: '#f2f4f9',
    tertiaryTextColor: '#3d4058',
    tertiaryBorderColor: '#e2e6ef',
    labelBackground: '#ffffff',
  },
  dark: {
    background: 'transparent',
    primaryColor: 'rgba(79,155,255,0.14)',
    primaryBorderColor: 'rgba(79,155,255,0.55)',
    primaryTextColor: '#eef1f8',
    lineColor: 'rgba(238,241,248,0.42)',
    textColor: '#c6ccdb',
    fontSize: '13px',
    edgeLabelBackground: '#151a26',
    tertiaryColor: '#1d2432',
    tertiaryTextColor: '#c6ccdb',
    tertiaryBorderColor: '#2d3648',
    labelBackground: '#151a26',
  },
};

const renderDiagram = async (
  id: string,
  definition: string,
  theme: DocsTheme
): Promise<string> => {
  const { default: mermaid } = await import('mermaid');

  // Mermaid sizes each node from the measured text width, so it must run after
  // the web font loads, otherwise a fallback metric clips the wider labels.
  if (document.fonts?.ready) await document.fonts.ready;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'var(--font-sans)',
    themeVariables: THEME_VARIABLES[theme],
  });

  const { svg } = await mermaid.render(id, definition);
  return svg;
};

export const Mermaid = ({
  chart,
  theme,
}: {
  chart: string;
  theme: DocsTheme;
}): ReactNode => {
  const reactId = useId();
  const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    setError(false);

    renderDiagram(id, chart, theme)
      .then((svg) => {
        if (active && hostRef.current) hostRef.current.innerHTML = svg;
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [id, chart, theme]);

  if (error) {
    return (
      <pre className='my-6 overflow-x-auto rounded-panel border border-line-2 bg-surface-2 p-4 font-mono text-[12.5px] leading-[1.5] text-ink-2'>
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={hostRef}
      role='img'
      className='lagune-mermaid my-6 flex justify-center overflow-x-auto rounded-panel border border-line-2 bg-surface-2 p-[clamp(14px,2.4vw,26px)] [&>svg]:h-auto [&>svg]:max-w-full'
    />
  );
};
