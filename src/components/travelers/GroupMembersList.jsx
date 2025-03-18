import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";

export function GroupMembersList({ members = [], onRemoveMember }) {
  if (!members.length) {
    return (
      <p className="text-sm text-gray-500">No hay personas en este grupo</p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((person) => (
        <div
          key={person.id}
          className="flex items-center justify-between bg-gray-50 p-2 rounded"
        >
          <span>{person.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveMember(person.id)}
          >
            <UserMinus className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  );
}
