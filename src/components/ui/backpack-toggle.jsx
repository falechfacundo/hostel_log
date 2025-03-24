"use client";

import { useState } from "react";
import { Backpack } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function BackpackToggle({ person, onUpdate, disabled = false }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasBackpack, setHasBackpack] = useState(person?.backpack || false);

  // Toggle backpack status
  const toggleBackpack = async () => {
    try {
      setIsUpdating(true);

      // New state is the opposite of current state
      const newBackpackState = !hasBackpack;

      // Locally update UI first for responsiveness
      setHasBackpack(newBackpackState);

      // Check if the onUpdate function exists before calling it
      if (typeof onUpdate === "function") {
        // Call the update function with the person's ID and the new backpack state
        await onUpdate({
          id: person.id,
          backpack: newBackpackState,
        });
      } else {
        // If onUpdate is not a function, throw an error that will be caught below
        throw new Error("Update function is not provided or is invalid");
      }
    } catch (error) {
      // Revert UI state if there was an error
      setHasBackpack(hasBackpack);
      console.error("Error toggling backpack:", error);
      toast.error("Error al actualizar estado de mochila");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center">
      <Checkbox
        id={`backpack-${person.id}`}
        checked={hasBackpack}
        onCheckedChange={toggleBackpack}
        disabled={isUpdating || disabled}
        className="h-4 w-4 rounded-sm data-[state=checked]:bg-blue-500"
      />
      <label
        htmlFor={`backpack-${person.id}`}
        className="ml-2 text-sm flex items-center gap-1 cursor-pointer"
      >
        <Backpack
          className={`h-3.5 w-3.5 ${
            hasBackpack ? "text-blue-500" : "text-muted-foreground"
          }`}
        />
        {isUpdating ? "Actualizando..." : ""}
      </label>
    </div>
  );
}
