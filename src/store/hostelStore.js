import { create } from "zustand";
import { toast } from "sonner";
// Import server actions
import {
  fetchHostels as fetchHostelsAction,
  addHostel as addHostelAction,
  updateHostel as updateHostelAction,
  deleteHostel as deleteHostelAction,
} from "@/actions/hostel-actions";

// Utility to create a cancellable fetch with retry
const createFetchWithRetry = () => {
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // Function to fetch with retry capability
  const fetchWithRetry = async (actionFn, ...args) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} after tab switch`);
        }

        const result = await actionFn(...args);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);

        // If we've reached max retries, throw the error
        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // Wait a bit before retrying (exponential backoff)
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  };

  return { fetchWithRetry };
};

export const useHostelStore = create((set, get) => {
  // Create the fetch utility
  const { fetchWithRetry } = createFetchWithRetry();

  // Set up visibility change listener
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      // When the page becomes visible again
      if (document.visibilityState === "visible") {
        const state = get();
        // If we're in a loading state, reset it
        if (state.isLoading) {
          console.log("Tab became visible, resetting loading state");
          set({ isLoading: false });

          // Optionally retry the hostels fetch
          get().fetchHostels();
        }
      }
    });
  }

  return {
    // Estado
    hostels: [],
    isLoading: false,
    error: null,

    // Acciones
    fetchHostels: async () => {
      try {
        set({ isLoading: true, error: null });

        // Call server action with retry
        const result = await fetchWithRetry(fetchHostelsAction);

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

        toast.success(`Albergue "${hostelData.name}" creado correctamente`);
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

        toast.success(`Albergue actualizado correctamente`);
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

        toast.success(
          `Albergue "${hostelToDelete.name}" eliminado correctamente`
        );
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
