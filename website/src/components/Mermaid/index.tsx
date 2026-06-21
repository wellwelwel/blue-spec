import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

let initialized = false;

const renderDiagram = async (id: string, definition: string) => {
  const { default: mermaid } = await import('mermaid');

  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'var(--font-sans)',
      themeVariables: {
        background: 'transparent',
        primaryColor: 'rgba(0,94,255,0.12)',
        primaryBorderColor: 'rgba(0,94,255,0.55)',
        primaryTextColor: '#e9edf7',
        lineColor: 'rgba(233, 237, 247,0.45)',
        textColor: 'rgba(233, 237, 247,0.82)',
        fontSize: '13px',
        edgeLabelBackground: 'rgba(10,15,31,0.92)',
        tertiaryColor: 'rgba(10,15,31,0.92)',
        tertiaryTextColor: 'rgba(233, 237, 247,0.82)',
        tertiaryBorderColor: 'rgba(233, 237, 247,0.18)',
        labelBackground: 'rgba(10,15,31,0.92)',
      },
    });
    initialized = true;
  }

  const { svg } = await mermaid.render(id, definition);
  return svg;
};

export const Mermaid = ({ chart }: { chart: string }): ReactNode => {
  const reactId = useId();
  const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    renderDiagram(id, chart)
      .then((svg) => {
        if (active && hostRef.current) hostRef.current.innerHTML = svg;
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [id, chart]);

  if (error) {
    return (
      <pre className='my-5 p-4 rounded-xl border border-line bg-[rgba(6,7,9,0.6)] overflow-x-auto font-mono text-[12.5px] leading-[1.5] text-[rgba(233, 237, 247,0.86)]'>
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={hostRef}
      role='img'
      className='bs-mermaid my-6 flex justify-center overflow-x-auto rounded-xl border border-line bg-[rgba(6,9,20,0.5)] p-[clamp(14px,2.4vw,26px)] [&>svg]:max-w-full [&>svg]:h-auto'
    />
  );
};
