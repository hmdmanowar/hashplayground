interface ResizeHandleProps {
  orientation: "vertical" | "horizontal";
  disabled: boolean;
  onResize: (deltaPx: number) => void;
  onResizeEnd: () => void;
  className?: string;
}

// A draggable divider between two panels. `orientation: "vertical"` is a
// vertical bar dragged left/right to resize width; "horizontal" is a
// horizontal bar dragged up/down to resize height. Always rendered (even
// when `disabled`) so panel spacing stays identical between resize modes —
// only the drag behavior and grip indicator toggle off.
function ResizeHandle({ orientation, disabled, onResize, onResizeEnd, className = "" }: ResizeHandleProps) {
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    let last = orientation === "vertical" ? event.clientX : event.clientY;

    function handleMove(moveEvent: PointerEvent) {
      const current = orientation === "vertical" ? moveEvent.clientX : moveEvent.clientY;
      onResize(current - last);
      last = current;
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onResizeEnd();
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`flex shrink-0 items-center justify-center ${
        orientation === "vertical" ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize"
      } ${disabled ? "" : "group"} ${className}`}
    >
      {!disabled && (
        <span
          className={`rounded bg-[var(--border-panel)] group-hover:bg-[var(--color-primary)] ${
            orientation === "vertical" ? "h-8 w-1" : "h-1 w-8"
          }`}
        />
      )}
    </div>
  );
}

export default ResizeHandle;
