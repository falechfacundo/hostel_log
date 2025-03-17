"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";

import { GroupMembersList } from "@/components/travelers/GroupMembersList";
import { AddGroupMemberForm } from "@/components/travelers/AddGroupMemberForm";

export function GroupItem({
  group,
  onDelete,
  onAddMember,
  onRemoveMember,
  isLoading,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <div>
              <p className="text-sm text-gray-500">
                {group.people?.length || 0} personas
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(group.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-red-500" />
          )}
        </Button>
      </div>

      {/* Lista de personas colapsable */}
      {isExpanded && (
        <div className="mt-4 ml-8 space-y-2">
          <GroupMembersList
            members={group.people || []}
            onRemoveMember={(personId) => onRemoveMember(group.id, personId)}
          />
          <AddGroupMemberForm groupId={group.id} onAddMember={onAddMember} />
        </div>
      )}
    </Card>
  );
}
