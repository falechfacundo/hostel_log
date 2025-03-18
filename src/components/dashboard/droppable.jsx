import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function Droppable({ children, id, disabled }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isOver && !disabled && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {children}
    </div>
  );
}
