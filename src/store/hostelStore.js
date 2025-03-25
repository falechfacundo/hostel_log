import { create } from "zustand";
import { toast } from "sonner";
// Import server actions
import {
  fetchHostels as fetchHostelsAction,
  addHostel as addHostelAction,
  updateHostel as updateHostelAction,
  deleteHostel as deleteHostelAction,
} from "@/actions/hostel-actions";

export const useHostelStore = create((set, get) => {
  return {
    // Estado
    hostels: [],
    isLoading: false,
    error: null,

    // Acciones
    fetchHostels: async () => {
      try {
        set({ isLoading: true, error: null });

        // Call server action directly
        const result = await fetchHostelsAction();

        // Handle errors from server action
        if (result.error) {
          throw new Error(result.error);
        }

        set({ hostels: result.hostels || [], isLoading: false });
        return result.hostels || [];
      } catch (error) {
        console.error("Error in fetchHostels:", error);
        set({ error: error.message, isLoading: false });
        toast.error(`Error al cargar albergues: ${error.message}`);
        throw error;
      }
    },

    addHostel: async (hostelData) => {
      try {
        set({ isLoading: true, error: null });

        // Call server action instead of direct Supabase call
        const result = await addHostelAction(hostelData);

        // Handle errors from server action
        if (result.error) {
          throw new Error(result.error);
        }

        // Update state with the new hostel
        set((state) => ({
          hostels: [...state.hostels, result.hostel],
          isLoading: false,
        }));

        return result.hostel;
      } catch (error) {
        console.error("Error in addHostel:", error);
        set({ error: error.message, isLoading: false });
        toast.error(`Error al crear albergue: ${error.message}`);
        throw error;
      }
    },

    updateHostel: async (id, data) => {
      try {
        set({ isLoading: true, error: null });

        // Call server action instead of direct Supabase call
        const result = await updateHostelAction(id, data);

        // Handle errors from server action
        if (result.error) {
          throw new Error(result.error);
        }

        // Update state with the modified hostel
        set((state) => ({
          hostels: state.hostels.map((h) => (h.id === id ? result.hostel : h)),
          isLoading: false,
        }));

        return result.hostel;
      } catch (error) {
        console.error("Error in updateHostel:", error);
        set({ error: error.message, isLoading: false });
        toast.error(`Error al actualizar albergue: ${error.message}`);
        throw error;
      }
    },

    deleteHostel: async (id) => {
      try {
        set({ isLoading: true, error: null });

        // Get hostel data before deletion
        const hostelToDelete = get().hostels.find((h) => h.id === id);
        if (!hostelToDelete) {
          throw new Error("Hostel not found");
        }

        // Call server action instead of direct Supabase call
        const result = await deleteHostelAction(id);

        // Handle errors from server action
        if (result.error) {
          throw new Error(result.error);
        }

        // Update state removing the hostel
        set((state) => ({
          hostels: state.hostels.filter((h) => h.id !== id),
          isLoading: false,
        }));

        return { id };
      } catch (error) {
        console.error("Error in deleteHostel:", error);
        set({ error: error.message, isLoading: false });
        toast.error(`Error al eliminar albergue: ${error.message}`);
        throw error;
      }
    },

    // Obtener un hostel específico por ID
    getHostelById: (id) => {
      return get().hostels.find((h) => h.id === id) || null;
    },

    // Resetear errores
    resetError: () => set({ error: null }),
  };
});
