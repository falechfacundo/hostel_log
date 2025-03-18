"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AddGroupMemberForm({ groupId, onAddMember }) {
  const [name, setName] = useState("");

  const handleAddMember = () => {
    if (!name.trim()) {
      toast.error("El nombre de la persona es requerido");
      return;
    }

    onAddMember(groupId, { name });
    setName("");
  };

  return (
    <div className="flex gap-2 mt-4">
      <Input
        placeholder="Nombre de la persona"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddMember();
          }
        }}
      />
      <Button variant="outline" onClick={handleAddMember}>
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  );
}
