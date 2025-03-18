"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RoomAssignmentItem({
  assignment,
  entity,
  removeAssignment,
  forceRemoval,
  isRoomFull,
}) {
  // Function to handle removal with fallback to force removal
  const handleRemove = (e) => {
    e.stopPropagation(); // Prevent any parent click events

    if (forceRemoval) {
      forceRemoval(assignment.id, assignment.roomId);
    } else if (removeAssignment) {
      removeAssignment(assignment.id);
    }
  };

  return (
    <div className="relative group bg-muted/40 rounded-md p-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {entity?.name || "Sin nombre"}
            {entity?.type === "group" && entity?.size && ` (${entity.size})`}
            {console.log(entity?.people)}
            <div className="space-y-2">
              <p>{entity?.people?.length} personas</p>
              <ul>
                {entity?.people?.map((person) => (
                  <li key={person.id} className="text-sm text-muted-foreground">
                    {person.name}
                  </li>
                ))}
              </ul>
            </div>
          </p>
        </div>
      </div>
    </div>
  );
}
