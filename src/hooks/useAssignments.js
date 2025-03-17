import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { useEffect } from "react";
import { selectedPartnerKey } from "@/store/partnerStore";

// Query keys - Exporta las keys para poder usarlas en otros componentes
export const assignmentKeys = {
  all: ["assignments"],
  lists: () => [...assignmentKeys.all, "list"],
  byDate: (date) => [...assignmentKeys.lists(), { date }],
  byDateAndPartner: (date, partnerId) => [
    ...assignmentKeys.byDate(date),
    { partnerId },
  ],
  details: () => [...assignmentKeys.all, "detail"],
  detail: (id) => [...assignmentKeys.details(), id],
};

// Modificamos fetchAssignmentsByDate para una correcta filtración por partner
const fetchAssignmentsByDate = async ({ date, partnerId }) => {
  const dateStr = format(new Date(date), "yyyy-MM-dd");

  try {
    // Primero obtenemos todas las asignaciones para la fecha especificada
    // con sus relaciones completas
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

    if (error) {
      console.error("Error fetching assignments:", error);
      throw error;
    }

    // Si no hay datos, devolvemos un array vacío
    if (!data || data.length === 0) {
      console.log("No assignments found for this date");
      return [];
    }

    // Filtrar en memoria por partnerId si se proporciona
    let filteredData = data;
    if (partnerId) {
      filteredData = data.filter((assignment) => {
        // Verificar si el grupo pertenece al partner
        if (assignment.group_id && assignment.groups) {
          return assignment.groups.partner_id === partnerId;
        }
        // Verificar si la persona pertenece al partner
        if (assignment.person_id && assignment.person) {
          return assignment.person.partner_id === partnerId;
        }
        return false;
      });
    }

    // Formateamos la respuesta
    return filteredData.map((assignment) => ({
      id: assignment.id,
      roomId: assignment.room_id,
      date: assignment.date,
      type: assignment.group_id ? "group" : "individual",
      groupId: assignment.group_id,
      individualId: assignment.person_id,
      entity: assignment.group_id ? assignment.groups : assignment.person,
    }));
  } catch (error) {
    console.error("Error in fetchAssignmentsByDate:", error);
    throw error;
  }
};

// Check if entity is assigned on a date
const checkEntityAssignment = async ({ entityId, entityType, date }) => {
  const dateStr = format(new Date(date), "yyyy-MM-dd");

  // Corregir los nombres de las columnas para que coincidan con tu base de datos
  const { count, error } = await supabase
    .from("assignments")
    .select("*", { count: "exact" })
    .eq("date", dateStr)
    .eq(entityType === "group" ? "group_id" : "person_id", entityId);

  if (error) throw error;

  return count > 0;
};

// Assign entity (group or individual) to a room - Modificado para devolver el resultado
const createAssignment = async ({ draggedId, roomId, date }) => {
  // Verificar que el ID tenga el formato esperado
  if (!draggedId || typeof draggedId !== "string" || !draggedId.includes("-")) {
    throw new Error("ID inválido: debe tener formato 'tipo-id'");
  }

  const [type, ...idParts] = draggedId.split("-");
  const id = idParts.join("-");
  const dateStr = format(new Date(date), "yyyy-MM-dd");

  // Usar los nombres de columna correctos de tu base de datos
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

  if (error) throw error;

  // Formato modificado para retornar directamente el resultado formateado
  return {
    id: data.id,
    roomId: data.room_id,
    date: data.date,
    type: data.group_id ? "group" : "individual",
    groupId: data.group_id,
    individualId: data.person_id,
    entity: data.group_id ? data.groups : data.person,
  };
};

// Remove an assignment
const deleteAssignment = async (id) => {
  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) throw error;
  return { id };
};

// Hook for assignments by date - modificado para recibir el partnerId
export function useAssignmentsByDate(date, partnerId) {
  const queryClient = useQueryClient();
  const dateKey = date ? format(new Date(date), "yyyy-MM-dd") : null;

  // Query for fetching assignments with aggressive revalidation settings
  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    // Incluir el partnerId en la queryKey
    queryKey: assignmentKeys.byDateAndPartner(dateKey, partnerId),
    // Pasar el partnerId al queryFn
    queryFn: () => fetchAssignmentsByDate({ date, partnerId }),
    enabled: !!date && !!partnerId,
    staleTime: 0, // Siempre considerar los datos como obsoletos
    cacheTime: 1000 * 60 * 5, // Mantener en caché por 5 minutos
    refetchOnMount: true, // Refetch cuando el componente se monta
    refetchOnWindowFocus: true, // Refetch cuando la ventana obtiene el foco
    retry: 3, // Reintentar hasta 3 veces si falla
  });

  // Create assignment mutation - modificada para devolver el valor
  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onMutate: async (variables) => {
      // Cancelar cualquier consulta en curso
      await queryClient.cancelQueries({
        queryKey: assignmentKeys.byDate(dateKey),
      });

      // No necesitamos hacer más en onMutate porque la actualización
      // optimista se maneja en el componente

      return {};
    },
    onSuccess: () => {
      // No invalidamos la consulta inmediatamente para evitar el layout shift
      // La actualización del ID se realizará manualmente en el componente
    },
    onError: (err) => {
      // En caso de error sí invalidamos para restaurar el estado correcto
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byDate(dateKey),
      });
    },
  });

  // Delete assignment with optimistic updates
  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteAssignment,
    onMutate: async (assignmentId) => {
      // Cancelar consultas en curso
      await queryClient.cancelQueries({
        queryKey: assignmentKeys.byDate(dateKey),
      });

      // Guardar el estado actual
      const previousAssignments = queryClient.getQueryData(
        assignmentKeys.byDate(dateKey)
      );

      // Actualizar optimistamente eliminando la asignación
      queryClient.setQueryData(assignmentKeys.byDate(dateKey), (old = []) =>
        old.filter((a) => a.id !== assignmentId)
      );

      return { previousAssignments };
    },
    onError: (err, assignmentId, context) => {
      // Restaurar estado anterior en caso de error
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          assignmentKeys.byDate(dateKey),
          context.previousAssignments
        );
      }
    },
    onSettled: () => {
      // Siempre invalidar la consulta después de una mutación
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byDate(dateKey),
      });
    },
  });

  // Check if entity is assigned
  const checkEntityAssignedMutation = useMutation({
    mutationFn: checkEntityAssignment,
  });

  // Helper function to check if entity is assigned
  const isEntityAssigned = async (entityId, entityType, checkDate) => {
    try {
      // Convertir a string en caso de que se pase date como objeto Date
      const dateToCheck = checkDate
        ? format(new Date(checkDate), "yyyy-MM-dd")
        : format(new Date(date), "yyyy-MM-dd");

      const isAssigned = await checkEntityAssignedMutation.mutateAsync({
        entityId,
        entityType,
        date: dateToCheck,
      });

      return isAssigned;
    } catch (error) {
      console.error("Error checking assignment:", error);
      return false;
    }
  };

  // Añadimos un useEffect para depuración
  useEffect(() => {
    // Solo invalidar si tenemos una fecha y un partnerId válidos
    if (dateKey && partnerId) {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byDateAndPartner(dateKey, partnerId),
      });
    }
  }, [dateKey, partnerId]);

  return {
    assignments,
    isLoading,
    error,
    refetch, // Expose refetch function
    // Modificamos para devolver una promesa con el resultado real
    assignGroup: (args) => createAssignmentMutation.mutateAsync(args),
    removeAssignment: deleteAssignmentMutation.mutate,
    isEntityAssigned,
  };
}
