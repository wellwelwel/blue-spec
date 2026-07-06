import type { ComponentChildren, VNode } from 'preact';
import { createPortal } from 'preact/compat';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';

export const HoverPopover = (props: {
  trigger: ComponentChildren;
  children: ComponentChildren | ((open: boolean) => ComponentChildren);
  width: number;
  triggerClass?: string;
  panelClass?: string;
}): VNode => {
  const ref = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!hovered || open) return;
    void panelRef.current?.offsetWidth;
    setOpen(true);
  }, [hovered, open]);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const margin = 12;
      const maxLeft = window.innerWidth - props.width - margin;
      setAnchor({
        left: Math.min(Math.max(margin, rect.left), Math.max(margin, maxLeft)),
        bottom: window.innerHeight - rect.top + 10,
      });
    }
    setHovered(true);
  };

  const hide = () => {
    setHovered(false);
    setOpen(false);
  };

  return (
    <span
      ref={ref}
      class={props.triggerClass}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {props.trigger}
      {anchor !== null &&
        createPortal(
          <span
            ref={panelRef}
            data-open={open ? 'true' : 'false'}
            class={`group/pop pointer-events-none fixed z-120 origin-bottom-left transition-[opacity,scale,translate] duration-200 ease-house will-change-transform ${
              props.panelClass ??
              'overflow-hidden rounded-xl bg-dark p-4 shadow-pop'
            } ${
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-1.5 scale-95 opacity-0'
            }`}
            style={{
              left: `${anchor.left}px`,
              bottom: `${anchor.bottom}px`,
              width: `${props.width}px`,
            }}
          >
            {typeof props.children === 'function'
              ? props.children(open)
              : props.children}
          </span>,
          document.body
        )}
    </span>
  );
};
