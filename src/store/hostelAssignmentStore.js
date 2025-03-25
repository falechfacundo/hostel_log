import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

export const useHostelAssignmentStore = create((set, get) => ({
  partnerAssignments: {}, // Objeto con claves partnerId-date
  allAssignments: {}, // Objeto con claves date
  isLoading: false,
  error: null,

  // Acciones
  fetchPartnerAssignments: async (partnerId, dateStr) => {
    if (!partnerId || !dateStr) {
      return [];
    }

    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("hostel_partner_assignments")
        .select("*, hostel:hostels(*)")
        .eq("partner_id", partnerId)
        .eq("date", dateStr);

      if (error)
        throw new Error(`Error fetching assignments: ${error.message}`);

      const key = `${partnerId}-${dateStr}`;
      set((state) => ({
        partnerAssignments: {
          ...state.partnerAssignments,
          [key]: data || [],
        },
        isLoading: false,
      }));

      return data || [];
    } catch (error) {
      console.error("Error in fetchPartnerAssignments:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchAllAssignments: async (dateStr) => {
    if (!dateStr) return [];

    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("hostel_partner_assignments")
        .select(
          `
          *,
          hostel:hostels(*),
          partner:partners(id, name, size)
        `
        )
        .eq("date", dateStr);

      if (error)
        throw new Error(`Error fetching all assignments: ${error.message}`);

      set((state) => ({
        allAssignments: { ...state.allAssignments, [dateStr]: data || [] },
        isLoading: false,
      }));

      return data || [];
    } catch (error) {
      console.error("Error in fetchAllAssignments:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addHostelAssignment: async (partnerId, hostelId, dateStr) => {
    if (!partnerId || !hostelId || !dateStr) {
      throw new Error("Partner ID, hostel ID, and date are required");
    }

    try {
      // Verificar si el hostel ya está asignado
      const allAssignmentsForDate = get().allAssignments[dateStr] || [];
      const existingAssignment = allAssignmentsForDate.find(
        (a) => a.hostel_id === hostelId && !a.id.toString().startsWith("temp-")
      );

      if (existingAssignment) {
        const partnerName = existingAssignment.partner?.name || "otro partner";
        throw new Error(`Este albergue ya está asignado a ${partnerName} hoy`);
      }

      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("hostel_partner_assignments")
        .insert({
          partner_id: partnerId,
          hostel_id: hostelId,
          date: dateStr,
        })
        .select("*, hostel:hostels(*)")
        .single();

      if (error) throw new Error(`Error creating assignment: ${error.message}`);

      // Actualizar ambos estados
      const partnerKey = `${partnerId}-${dateStr}`;
      set((state) => {
        // Actualizar asignaciones del partner
        const currentPartnerAssignments =
          state.partnerAssignments[partnerKey] || [];
        const newPartnerAssignments = {
          ...state.partnerAssignments,
          [partnerKey]: [...currentPartnerAssignments, data],
        };

        // Actualizar todas las asignaciones
        const currentAllAssignments = state.allAssignments[dateStr] || [];
        const newAllAssignments = {
          ...state.allAssignments,
          [dateStr]: [
            ...currentAllAssignments,
            {
              ...data,
              partner: { id: partnerId, name: "Partner actualizado" }, // Podríamos mejorar esto obteniendo el nombre real
            },
          ],
        };

        return {
          partnerAssignments: newPartnerAssignments,
          allAssignments: newAllAssignments,
          isLoading: false,
        };
      });
      return data;
    } catch (error) {
      console.error("Error in addHostelAssignment:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al asignar albergue: ${error.message}`);
      throw error;
    }
  },

  removeHostelAssignment: async (assignmentId) => {
    try {
      // Primero obtenemos los datos de la asignación para actualizar el estado correctamente después
      const allAssignments = Object.values(get().allAssignments).flat();
      const assignmentToRemove = allAssignments.find(
        (a) => a.id === assignmentId
      );

      if (!assignmentToRemove) {
        throw new Error("Assignment not found");
      }

      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from("hostel_partner_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw new Error(`Error removing assignment: ${error.message}`);

      // Actualizar ambos estados eliminando la asignación
      const partnerId = assignmentToRemove.partner_id;
      const dateStr = assignmentToRemove.date;
      const partnerKey = `${partnerId}-${dateStr}`;

      set((state) => {
        // Actualizar asignaciones del partner
        const newPartnerAssignments = { ...state.partnerAssignments };
        if (newPartnerAssignments[partnerKey]) {
          newPartnerAssignments[partnerKey] = newPartnerAssignments[
            partnerKey
          ].filter((a) => a.id !== assignmentId);
        }

        // Actualizar todas las asignaciones
        const newAllAssignments = { ...state.allAssignments };
        if (newAllAssignments[dateStr]) {
          newAllAssignments[dateStr] = newAllAssignments[dateStr].filter(
            (a) => a.id !== assignmentId
          );
        }

        return {
          partnerAssignments: newPartnerAssignments,
          allAssignments: newAllAssignments,
          isLoading: false,
        };
      });
      return { id: assignmentId };
    } catch (error) {
      console.error("Error in removeHostelAssignment:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al eliminar asignación: ${error.message}`);
      throw error;
    }
  },

  // Helpers
  getPartnerAssignments: (partnerId, dateStr) => {
    if (!partnerId || !dateStr) return [];
    const key = `${partnerId}-${dateStr}`;
    return get().partnerAssignments[key] || [];
  },

  isHostelAssigned: (hostelId, dateStr) => {
    const assignments = get().allAssignments[dateStr] || [];
    return assignments.some((a) => a.hostel_id === hostelId);
  },

  getPartnerForHostel: (hostelId, dateStr) => {
    const assignments = get().allAssignments[dateStr] || [];
    return assignments.find((a) => a.hostel_id === hostelId)?.partner || null;
  },

  // Resetear errores
  resetError: () => set({ error: null }),

  // Limpiar cache de asignaciones
  clearCache: () =>
    set({
      partnerAssignments: {},
      allAssignments: {},
    }),
}));
