import { Button } from "@/components/ui/button";
import { Bed, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function RoomList({ rooms = [], onDeleteRoom }) {
  if (!rooms.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No hay habitaciones creadas
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex items-center gap-8 bg-gray-50 p-2 rounded w-full justify-between"
        >
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-2 text-gray-500" />
            <span>{room.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {room.capacity} personas
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onDeleteRoom(room.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
