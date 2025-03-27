"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Replace TanStack Query hooks with Zustand stores
import { useHostelStore } from "@/store/hostelStore";
import { useRoomStore } from "@/store/roomStore";

import { RoomList } from "@/components/hostel/room-list";
import { AddRoomForm } from "@/components/hostel/add-room-form";
import { HostelHeader } from "@/components/hostel/hostel-header";
import { EditHostelForm } from "@/components/hostel/edit-hostel-form";
import { useEffect } from "react";

export function HostelCard({
  hostel,
  activeHostelId,
  setActiveHostelId,
  date,
  assignments = [],
}) {
  const deleteHostel = useHostelStore((state) => state.deleteHostel);
  const updateHostel = useHostelStore((state) => state.updateHostel);
  const [isEditing, setIsEditing] = useState(false);

  const getRoomsByHostel = useRoomStore((state) => state.getRoomsByHostel);
  const fetchRoomsByHostel = useRoomStore((state) => state.fetchRoomsByHostel);
  const addRoom = useRoomStore((state) => state.addRoom);
  const deleteRoom = useRoomStore((state) => state.deleteRoom);

  // Fetch rooms when component mounts
  useEffect(() => {
    if (hostel?.id) {
      fetchRoomsByHostel(hostel.id);
    }
  }, [hostel?.id, fetchRoomsByHostel]);

  // Get rooms for this hostel from store
  const rooms = getRoomsByHostel(hostel.id) || [];

  // Calculate remaining capacity for informational purposes
  const usedCapacity = rooms.reduce(
    (sum, room) => sum + (room.capacity || 0),
    0
  );
  const remainingCapacity = hostel.capacity - usedCapacity;

  const handleUpdateHostel = () => {
    setIsEditing(true);
  };

  const handleSaveHostelUpdate = async (data) => {
    try {
      await updateHostel(hostel.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating hostel:", error);
      toast.error("Error al actualizar el albergue");
    }
  };

  return (
    <Card className="p-6">
      {isEditing ? (
        <EditHostelForm
          hostel={hostel}
          onSave={handleSaveHostelUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <HostelHeader
          hostel={hostel}
          onDelete={deleteHostel}
          onUpdate={handleUpdateHostel}
        />
      )}

      <div className="flex flex-col justify-between">
        <div className="justify-start space-y-2">
          <h4 className="font-medium">Habitaciones</h4>
          <p className="text-sm text-muted-foreground">
            Capacidad: {usedCapacity}/{hostel.capacity} ({remainingCapacity}{" "}
            disponibles)
          </p>
          <RoomList
            rooms={rooms}
            onDeleteRoom={(roomId) => deleteRoom(hostel.id, roomId)}
          />
        </div>

        {/* Formulario para añadir habitaciones */}
        {activeHostelId === hostel.id ? (
          <AddRoomForm
            onAddRoom={(roomData) => {
              addRoom(hostel.id, roomData, hostel.capacity);
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
