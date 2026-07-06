import type { TypeSegment } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ReactTyped } from 'react-typed';

export const TypedText = ({
  segments,
  strong,
  typeSpeed,
  startDelay,
  active = true,
  onDone,
}: {
  segments: TypeSegment[];
  strong: string;
  typeSpeed: number;
  startDelay: number;
  active?: boolean;
  onDone?: () => void;
}): VNode | null => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) setIndex(0);
  }, [active]);

  if (!active) return null;

  return (
    <>
      {segments.map((segment, position) => {
        if (position > index) return null;

        const lead = segment.text.slice(
          0,
          segment.text.length - segment.text.trimStart().length
        );
        const trail = segment.text.slice(segment.text.trimEnd().length);
        const core = segment.text.slice(
          lead.length,
          segment.text.length - trail.length
        );

        const content =
          position === index ? (
            <>
              {lead}
              <ReactTyped
                strings={[core]}
                typeSpeed={typeSpeed}
                startDelay={position === 0 ? startDelay : 0}
                showCursor
                cursorChar='▍'
                loop={false}
                onComplete={() => {
                  setIndex(position + 1);
                  if (position === segments.length - 1) onDone?.();
                }}
              />
              {trail}
            </>
          ) : (
            segment.text
          );

        return segment.bold ? (
          <span key={position} class={strong}>
            {content}
          </span>
        ) : (
          <Fragment key={position}>{content}</Fragment>
        );
      })}
    </>
  );
};
