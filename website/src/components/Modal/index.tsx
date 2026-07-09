import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuSearch, LuX } from 'react-icons/lu';

/*
 * The one dialog scaffold every modal shares: a portaled backdrop that closes
 * on click and Escape, a focused panel that locks the body scroll while open,
 * and the recurring header, close button, and search field.
 */

export const Modal = ({
  open,
  onClose,
  label,
  panelClassName,
  panelStyle,
  padding = 'p-[clamp(12px,4vw,48px)]',
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  panelClassName: string;
  panelStyle?: CSSProperties;
  padding?: string;
  children: ReactNode;
}): ReactNode => {
  const panelRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

  return createPortal(
    <div
      className={`lagune-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center ${padding} bg-[rgba(2,4,12,0.72)] [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]`}
      onClick={onClose}
      role='presentation'
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={panelClassName}
        style={panelStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const ModalHeader = ({
  children,
}: {
  children: ReactNode;
}): ReactNode => (
  <div className='flex items-center justify-between gap-4 shrink-0 px-[clamp(20px,3vw,32px)] py-4 border-b border-[#0c155c] bg-[#0a0f1f]'>
    {children}
  </div>
);

export const ModalSearch = ({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}): ReactNode => (
  <div className='shrink-0 px-[clamp(20px,3vw,32px)] pt-[clamp(20px,3vw,28px)]'>
    <div className='relative'>
      <LuSearch
        aria-hidden
        className='pointer-events-none absolute left-[14px] top-1/2 size-[18px] -translate-y-1/2 text-[#888c99]'
      />
      <input
        type='text'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        autoFocus
        className='w-full rounded-[14px] border border-line bg-card py-[12px] pl-[42px] pr-[14px] font-mono !text-[16px] text-ink placeholder:text-[#888c99] transition-[border-color,background-color] duration-200 ease-out hover:border-white/[0.16] focus:border-accent/50 focus:bg-accent/[0.06] focus:outline-none'
      />
    </div>
  </div>
);

export const ModalClose = ({
  onClose,
  className = 'relative inline-flex items-center justify-center size-9 -mr-1.5 rounded-full text-[#9499a5] cursor-pointer transition-[color,background-color] duration-200 ease-out hover:bg-white/[0.08] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[18px]',
}: {
  onClose: () => void;
  className?: string;
}): ReactNode => (
  <button
    type='button'
    onClick={onClose}
    aria-label='Close'
    className={className}
  >
    <LuX />
  </button>
);
