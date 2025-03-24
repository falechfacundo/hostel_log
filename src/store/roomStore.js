import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useRoomStore = create((set, get) => ({
  // Estado
  rooms: {}, // Objeto donde las claves son hostelId y los valores son arrays de rooms
  isLoading: false,
  error: null,

  // Acciones
  fetchRoomsByHostel: async (hostelId) => {
    if (!hostelId) return [];

    try {
      set((state) => ({
        isLoading: true,
        error: null,
        // Mantener las otras habitaciones mientras se cargan las nuevas
        rooms: { ...state.rooms },
      }));

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hostel_id", hostelId);

      if (error) throw new Error(`Error fetching rooms: ${error.message}`);

      // Actualizar solo las habitaciones del hostel especificado
      set((state) => ({
        rooms: { ...state.rooms, [hostelId]: data || [] },
        isLoading: false,
      }));

      return data || [];
    } catch (error) {
      console.error("Error in fetchRoomsByHostel:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addRoom: async (hostelId, roomData, hostelCapacity) => {
    try {
      // Verificar capacidad del albergue
      const currentRooms = get().rooms[hostelId] || [];
      const currentUsedCapacity = currentRooms.reduce(
        (sum, room) => sum + (room.capacity || 0),
        0
      );

      if (currentUsedCapacity + roomData.capacity > hostelCapacity) {
        throw new Error(
          `La capacidad total de las habitaciones excedería el límite del albergue (${hostelCapacity} personas)`
        );
      }

      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("rooms")
        .insert([{ ...roomData, hostel_id: hostelId }])
        .select()
        .single();

      if (error) throw new Error(`Error creating room: ${error.message}`);

      // Actualizar el estado con la nueva habitación
      set((state) => {
        const currentHostelRooms = state.rooms[hostelId] || [];
        return {
          rooms: {
            ...state.rooms,
            [hostelId]: [...currentHostelRooms, data],
          },
          isLoading: false,
        };
      });

      return data;
    } catch (error) {
      console.error("Error in addRoom:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al crear habitación: ${error.message}`);
      throw error;
    }
  },

  updateRoom: async (roomId, data) => {
    try {
      set({ isLoading: true, error: null });

      const { data: updatedData, error } = await supabase
        .from("rooms")
        .update(data)
        .eq("id", roomId)
        .select()
        .single();

      if (error) throw new Error(`Error updating room: ${error.message}`);

      // Actualizar el estado con la habitación modificada
      set((state) => {
        const hostelId = updatedData.hostel_id;
        const currentHostelRooms = state.rooms[hostelId] || [];

        return {
          rooms: {
            ...state.rooms,
            [hostelId]: currentHostelRooms.map((r) =>
              r.id === roomId ? updatedData : r
            ),
          },
          isLoading: false,
        };
      });

      return updatedData;
    } catch (error) {
      console.error("Error in updateRoom:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al actualizar habitación: ${error.message}`);
      throw error;
    }
  },

  deleteRoom: async (hostelId, roomId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) throw new Error(`Error deleting room: ${error.message}`);

      // Actualizar el estado eliminando la habitación
      set((state) => {
        const currentHostelRooms = state.rooms[hostelId] || [];
        return {
          rooms: {
            ...state.rooms,
            [hostelId]: currentHostelRooms.filter((r) => r.id !== roomId),
          },
          isLoading: false,
        };
      });

      return { id: roomId };
    } catch (error) {
      console.error("Error in deleteRoom:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al eliminar habitación: ${error.message}`);
      throw error;
    }
  },

  // Obtener habitaciones para un hostel específico
  getRoomsByHostel: (hostelId) => {
    return get().rooms[hostelId] || [];
  },

  // Resetear errores
  resetError: () => set({ error: null }),
}));
