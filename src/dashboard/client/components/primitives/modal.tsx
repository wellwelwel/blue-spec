import type { ComponentChildren, VNode } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';

export const Modal = (props: {
  onClose: () => void;
  label: string;
  width?: string;
  children: ComponentChildren;
}): VNode => {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') props.onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div
      class='lagune-backdrop fixed inset-0 z-100 flex items-center justify-center p-[clamp(12px,4vw,48px)] backdrop-blur-[6px]'
      onClick={props.onClose}
      role='presentation'
    >
      <div
        ref={panel}
        class={`lagune-panel relative flex w-full ${props.width ?? 'max-w-130'} flex-col overflow-hidden rounded-xl shadow-pop outline-none`}
        role='dialog'
        aria-modal='true'
        aria-label={props.label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {props.children}
      </div>
    </div>,
    document.body
  );
};
