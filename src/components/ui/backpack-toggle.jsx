import { useState, useEffect } from "react";
import { Backpack } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePartnerStore } from "@/store/partnerStore";

export function BackpackToggle({ person, onUpdate, disabled = false }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticBackpack, setOptimisticBackpack] = useState(
    !!person.backpack
  );

  // Get store update functions for optimistic UI updates
  const { updateIndividual } = usePartnerStore();

  // Update local state if person prop changes
  useEffect(() => {
    setOptimisticBackpack(!!person.backpack);
  }, [person.backpack]);

  // Use the optimistic state for UI rendering
  const hasBackpack = optimisticBackpack;

  const toggleBackpack = async (checked) => {
    if (disabled || isUpdating) return;

    setIsUpdating(true);

    // Immediately update local state for optimistic UI
    setOptimisticBackpack(checked);

    // Create optimistic person object for store update
    const optimisticPerson = {
      ...person,
      backpack: checked,
    };

    // Update store optimistically
    updateIndividual(optimisticPerson);

    try {
      // Perform the actual update
      await onUpdate({
        id: person.id,
        backpack: checked,
      });

      // No need to set state again on success since we've already updated optimistically
    } catch (error) {
      console.error("Error toggling backpack:", error);

      // Revert optimistic update on error
      setOptimisticBackpack(!!person.backpack);

      // Also revert store update
      updateIndividual({
        ...person,
        backpack: !checked,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Tooltip content={hasBackpack ? "Quitar mochila" : "Añadir mochila"}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`backpack-${person.id}`}
          checked={hasBackpack}
          onCheckedChange={toggleBackpack}
          disabled={disabled || isUpdating}
        />
        <label
          htmlFor={`backpack-${person.id}`}
          className={cn(
            "flex items-center gap-1 text-xs cursor-pointer",
            hasBackpack ? "text-primary" : "text-muted-foreground",
            isUpdating && "opacity-50"
          )}
        >
          <Backpack
            className={cn("h-3.5 w-3.5", isUpdating && "animate-bounce")}
          />
          {isUpdating && <span className="animate-pulse">...</span>}
        </label>
      </div>
    </Tooltip>
  );
}
