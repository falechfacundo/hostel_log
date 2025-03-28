import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

export const useAssignmentStore = create((set, get) => ({
  // Estado
  assignments: {}, // Objetos organizados por fecha y partnerId
  isLoading: false,
  error: null,

  // Acciones
  fetchAssignmentsByDate: async (date, partnerId) => {
    if (!date) return [];

    const dateStr = format(new Date(date), "yyyy-MM-dd");

    try {
      set({ isLoading: true, error: null });

      // Consulta a la base de datos
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          *,
          groups!group_id(id, size, partner_id),
          person!person_id(id, name, partner_id),
          room:room_id(*)
        `
        )
        .eq("date", dateStr);

      if (error)
        throw new Error(`Error fetching assignments: ${error.message}`);

      // Filtrar por partnerId si es necesario
      let filteredData = data || [];
      if (partnerId) {
        filteredData = filteredData.filter((assignment) => {
          if (assignment.group_id && assignment.groups) {
            return assignment.groups.partner_id === partnerId;
          }
          if (assignment.person_id && assignment.person) {
            return assignment.person.partner_id === partnerId;
          }
          return false;
        });
      }

      // Formatear los datos
      const formattedData = filteredData.map((assignment) => ({
        id: assignment.id,
        roomId: assignment.room_id,
        date: assignment.date,
        type: assignment.group_id ? "group" : "individual",
        groupId: assignment.group_id,
        individualId: assignment.person_id,
        entity: assignment.group_id ? assignment.groups : assignment.person,
      }));

      // Actualizar el estado
      const cacheKey = partnerId ? `${dateStr}-${partnerId}` : dateStr;
      set((state) => ({
        assignments: { ...state.assignments, [cacheKey]: formattedData },
        isLoading: false,
      }));

      return formattedData;
    } catch (error) {
      console.error("Error in fetchAssignmentsByDate:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createAssignment: async (draggedId, roomId, date) => {
    if (
      !draggedId ||
      typeof draggedId !== "string" ||
      !draggedId.includes("-")
    ) {
      throw new Error("ID inválido: debe tener formato 'tipo-id'");
    }

    const [type, ...idParts] = draggedId.split("-");
    const id = idParts.join("-");
    const dateStr = format(new Date(date), "yyyy-MM-dd");

    try {
      set({ isLoading: true, error: null });

      // Crear la asignación en la base de datos
      const newAssignment = {
        room_id: roomId,
        date: dateStr,
        ...(type === "group"
          ? { group_id: id, person_id: null }
          : { person_id: id, group_id: null }),
      };

      const { data, error } = await supabase
        .from("assignments")
        .insert([newAssignment])
        .select(
          `
          *,
          groups!group_id(*),
          person!person_id(*),
          room:room_id(*)
        `
        )
        .single();

      if (error) throw new Error(`Error creating assignment: ${error.message}`);

      // Formatear la respuesta
      const formattedAssignment = {
        id: data.id,
        roomId: data.room_id,
        date: data.date,
        type: data.group_id ? "group" : "individual",
        groupId: data.group_id,
        individualId: data.person_id,
        entity: data.group_id ? data.groups : data.person,
      };

      // Actualizar el estado
      // Para todas las claves que contienen esta fecha
      const partnerId = formattedAssignment.entity?.partner_id;

      set((state) => {
        const newState = { ...state };
        const exactKey = partnerId ? `${dateStr}-${partnerId}` : dateStr;
        const dateOnlyKey = dateStr;

        // Actualizar asignaciones con clave exacta y solo fecha
        for (const key of [exactKey, dateOnlyKey]) {
          if (newState.assignments[key]) {
            newState.assignments[key] = [
              ...newState.assignments[key],
              formattedAssignment,
            ];
          }
        }

        return {
          ...newState,
          isLoading: false,
        };
      });

      return formattedAssignment;
    } catch (error) {
      console.error("Error in createAssignment:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al crear asignación: ${error.message}`);
      throw error;
    }
  },

  deleteAssignment: async (assignmentId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw new Error(`Error deleting assignment: ${error.message}`);

      // Actualizar el estado eliminando la asignación de todas las claves
      set((state) => {
        const newAssignments = { ...state.assignments };

        // Iterar a través de todas las claves de asignaciones
        Object.keys(newAssignments).forEach((key) => {
          newAssignments[key] = newAssignments[key].filter(
            (a) => a.id !== assignmentId
          );
        });

        return {
          assignments: newAssignments,
          isLoading: false,
        };
      });

      return { id: assignmentId };
    } catch (error) {
      console.error("Error in deleteAssignment:", error);
      set({ error: error.message, isLoading: false });
      toast.error(`Error al eliminar asignación: ${error.message}`);
      throw error;
    }
  },

  deleteAssignmentsByHostelAndDate: async (hostelId, dateStr) => {
    if (!hostelId || !dateStr) {
      console.error("Missing hostelId or date for deletion");
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Step 1: Get all rooms associated with this hostel
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .eq("hostel_id", hostelId);

      if (roomsError) {
        throw new Error(
          `Error fetching rooms for hostel: ${roomsError.message}`
        );
      }

      if (!rooms || rooms.length === 0) {
        // No rooms found for this hostel
        set({ isLoading: false });
        return { deleted: 0 };
      }

      // Extract room IDs
      const roomIds = rooms.map((room) => room.id);

      // Step 2: Delete all assignments for these rooms on the specified date
      const { data: deleted, error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .in("room_id", roomIds)
        .eq("date", dateStr)
        .select();

      if (deleteError) {
        throw new Error(
          `Error deleting room assignments: ${deleteError.message}`
        );
      }

      // Step 3: Update local state to reflect deletions
      set((state) => {
        const newAssignments = { ...state.assignments };

        // Update all relevant date entries
        Object.keys(newAssignments).forEach((key) => {
          if (key.includes(dateStr)) {
            // Filter out deleted assignments
            newAssignments[key] = newAssignments[key].filter(
              (assignment) => !roomIds.includes(assignment.roomId)
            );
          }
        });

        return {
          assignments: newAssignments,
          isLoading: false,
        };
      });

      return { deleted: deleted?.length || 0 };
    } catch (error) {
      console.error("Error in deleteAssignmentsByHostelAndDate:", error);
      set({ error: error.message, isLoading: false });
      toast.error(
        `Error al eliminar asignaciones de habitaciones: ${error.message}`
      );
      throw error;
    }
  },

  // Obtener asignaciones para una fecha y partner específicos
  getAssignmentsByDateAndPartner: (date, partnerId) => {
    if (!date) return [];

    const dateStr = format(new Date(date), "yyyy-MM-dd");
    const cacheKey = partnerId ? `${dateStr}-${partnerId}` : dateStr;

    return get().assignments[cacheKey] || [];
  },

  // Verificar si una entidad está asignada
  isEntityAssigned: (entityId, entityType, date) => {
    if (!date || !entityId || !entityType) return false;

    const dateStr = format(new Date(date), "yyyy-MM-dd");
    const assignments = Object.values(get().assignments)
      .flat()
      .filter((a) => a.date === dateStr);

    return assignments.some(
      (assignment) =>
        (entityType === "group" && assignment.groupId === entityId) ||
        (entityType === "individual" && assignment.individualId === entityId)
    );
  },

  // Limpiar todas las asignaciones
  clearAssignments: () => set({ assignments: {} }),

  // Limpiar cache y forzar recarga
  clearCache: () => set({ assignments: {} }),

  // Resetear errores
  resetError: () => set({ error: null }),
}));
