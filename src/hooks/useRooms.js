import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { hostelKeys } from "@/hooks/useHostels";

// Query keys
export const roomKeys = {
  all: ["rooms"],
  lists: () => [...roomKeys.all, "list"],
  list: (filters) => [...roomKeys.lists(), { filters }],
  byHostel: (hostelId) => [...roomKeys.lists(), { hostelId }],
  details: () => [...roomKeys.all, "detail"],
  detail: (id) => [...roomKeys.details(), id],
};

// Fetch rooms by hostel
const fetchRoomsByHostel = async (hostelId) => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("hostel_id", hostelId);

  if (error) throw error;
  return data;
};

// Fetch a single room
const fetchRoomById = async (id) => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new room
const createRoom = async ({ hostelId, roomData }) => {
  console.log("Creating room", roomData);
  console.log("Hostel ID", hostelId);

  const { data, error } = await supabase
    .from("rooms")
    .insert([{ ...roomData, hostel_id: hostelId }])
    .select()
    .single();

  console.log("Data", data);
  console.log("Error", error);

  if (error) throw error;
  return data;
};

// Update a room
const updateRoom = async ({ id, data }) => {
  const { data: updatedData, error } = await supabase
    .from("rooms")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedData;
};

// Delete a room
const deleteRoom = async ({ hostelId, roomId }) => {
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) throw error;
  return { id: roomId, hostelId };
};

// Hook for rooms of a specific hostel
export function useRoomsByHostel(hostelId) {
  const queryClient = useQueryClient();

  const {
    data: rooms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: roomKeys.byHostel(hostelId),
    queryFn: () => fetchRoomsByHostel(hostelId),
    enabled: !!hostelId,
    staleTime: 1000, // 1 segundo antes de considerar los datos obsoletos
    refetchOnMount: true, // Refetch cuando el componente se monta
  });

  // Add a room
  const addRoomMutation = useMutation({
    mutationFn: ({ roomData, hostelCapacity }) => {
      // Calculate current total capacity
      const currentUsedCapacity = rooms.reduce(
        (sum, room) => sum + (room.capacity || 0),
        0
      );

      // Check if adding new room would exceed hostel capacity
      if (currentUsedCapacity + roomData.capacity > hostelCapacity) {
        throw new Error(
          `La capacidad total de las habitaciones excedería el límite del albergue (${hostelCapacity} personas)`
        );
      }

      return createRoom({ hostelId, roomData });
    },
    onSuccess: (newRoom) => {
      // Actualizar el cache inmediatamente
      queryClient.setQueryData(roomKeys.byHostel(hostelId), (old = []) => [
        ...old,
        newRoom,
      ]);
      // Luego invalidar para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: roomKeys.byHostel(hostelId) });
      queryClient.invalidateQueries({ queryKey: hostelKeys.detail(hostelId) });
    },
    onError: (err) => {
      toast.error(`Error al crear habitación: ${err.message}`);
    },
  });

  // Update a room
  const updateRoomMutation = useMutation({
    mutationFn: updateRoom,
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.byHostel(hostelId) });
      queryClient.invalidateQueries({ queryKey: hostelKeys.detail(hostelId) });
    },
    onError: (err) => {
      toast.error(`Error al actualizar habitación: ${err.message}`);
    },
  });

  // Delete a room
  const deleteRoomMutation = useMutation({
    mutationFn: (roomId) => deleteRoom({ hostelId, roomId }),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.byHostel(hostelId) });
      queryClient.invalidateQueries({ queryKey: hostelKeys.detail(hostelId) });
    },
    onError: (err) => {
      toast.error(`Error al eliminar habitación: ${err.message}`);
    },
  });

  return {
    rooms,
    isLoading,
    error,
    addRoom: (roomData, hostelCapacity) =>
      addRoomMutation.mutate({ roomData, hostelCapacity }),
    updateRoom: updateRoomMutation.mutate,
    deleteRoom: deleteRoomMutation.mutate,
  };
}
