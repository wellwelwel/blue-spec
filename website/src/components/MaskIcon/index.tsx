import type { ReactNode } from 'react';

/* A monochrome icon drawn by masking the current background color with an
   SVG file, so its tint follows text color utilities on the className. */
export const MaskIcon = ({
  src,
  className,
}: {
  src: string;
  className?: string;
}): ReactNode => (
  <span
    className={className}
    style={{
      maskImage: `url(${src})`,
      WebkitMaskImage: `url(${src})`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
    }}
  />
);
