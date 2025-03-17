"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useHostels } from "@/hooks/useHostels";
import { useRoomsByHostel } from "@/hooks/useRooms";

import { RoomList } from "@/components/hostel/room-list";
import { AddRoomForm } from "@/components/hostel/add-room-form";
import { HostelHeader } from "@/components/hostel/hostel-header";

export function HostelCard({
  hostel,
  activeHostelId,
  setActiveHostelId,
  date,
  assignments = [],
}) {
  const { deleteHostel } = useHostels();
  const { rooms = [], addRoom, deleteRoom } = useRoomsByHostel(hostel.id);

  // Calculate remaining capacity for informational purposes
  const usedCapacity = rooms.reduce(
    (sum, room) => sum + (room.capacity || 0),
    0
  );
  const remainingCapacity = hostel.capacity - usedCapacity;

  return (
    <Card className="p-6">
      <HostelHeader hostel={hostel} onDelete={deleteHostel} />

      <div className="flex flex-col justify-between">
        <div className="justify-start space-y-2">
          <h4 className="font-medium">Habitaciones</h4>
          <p className="text-sm text-muted-foreground">
            Capacidad: {usedCapacity}/{hostel.capacity} ({remainingCapacity}{" "}
            disponibles)
          </p>
          <RoomList rooms={rooms} onDeleteRoom={deleteRoom} />
        </div>

        {/* Formulario para añadir habitaciones */}
        {activeHostelId === hostel.id ? (
          <AddRoomForm
            onAddRoom={(roomData) => {
              addRoom(roomData, hostel.capacity);
              setActiveHostelId(null);
            }}
            maxCapacity={remainingCapacity}
          />
        ) : (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setActiveHostelId(hostel.id)}
            disabled={remainingCapacity <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Habitación
          </Button>
        )}
      </div>
    </Card>
  );
}
