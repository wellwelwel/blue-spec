type FrameResizeObserver = Pick<ResizeObserver, 'observe' | 'disconnect'>;

export const frameResizeObserver = (
  callback: () => void
): FrameResizeObserver => {
  let frame = 0;

  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(callback);
  });

  return {
    observe: (target) => observer.observe(target),
    disconnect: () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
  };
};
