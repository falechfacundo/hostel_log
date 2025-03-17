import { useDraggable } from "@dnd-kit/core";

export function Draggable({ children, id, disabled }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={disabled ? "pointer-events-none" : ""}
    >
      {children}
    </div>
  );
}
