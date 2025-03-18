import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddRoomForm({ onAddRoom }) {
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });

  const handleSubmit = () => {
    if (!newRoom.capacity) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    onAddRoom({
      capacity: parseInt(newRoom.capacity),
    });

    setNewRoom({ name: "", capacity: "" });
  };

  return (
    <div className="flex gap-2 mt-4">
      <Input
        placeholder="Capacidad"
        type="number"
        value={newRoom.capacity}
        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
        className="w-24"
      />
      <Button onClick={handleSubmit} variant="outline">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
