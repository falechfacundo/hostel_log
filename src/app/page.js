"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Building2, X, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { format } from "date-fns";
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import { useTravelers, travelerKeys } from "@/hooks/useTravelers"; // Importar travelerKeys
import { useHostels } from "@/hooks/useHostels";
import { useAssignmentsByDate, assignmentKeys } from "@/hooks/useAssignments";
import { useQueryClient } from "@tanstack/react-query"; // Importar useQueryClient

import { Draggable } from "@/components/dashboard/draggable";
import { Droppable } from "@/components/dashboard/droppable";
import { IndividualsPanel } from "@/components/dashboard/individuals-panel";
import { GroupsPanel } from "@/components/dashboard/groups-panel";
import { HostelRooms } from "@/components/dashboard/hostel-rooms";
import { Skeleton } from "@/components/ui/skeleton"; // Importar componente de skeleton
import { DownloadAllRoomsButton } from "@/components/dashboard/download-all-rooms-button";
import { queryClient } from "@/lib/queryClient";
import { selectedPartnerKey } from "@/store/partnerStore";
// Import the date store
import { useDateStore } from "@/store/date-store";

// Import the hostel assignments hook
import { useHostelAssignments } from "@/hooks/useHostelAssignments";

export default function Dashboard() {
  // Use the global date store instead of local state
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);
  // Agregar un estado separado para tracking de asignaciones que podamos modificar directamente
  const [manualAssignmentStatus, setManualAssignmentStatus] = useState({
    groups: {},
    individuals: {},
  });

  const sensors = useSensors(useSensor(PointerSensor));
  const queryClient = useQueryClient();

  // Obtener el partner seleccionado
  const selectedPartner = queryClient.getQueryData(selectedPartnerKey);

  // Obtener datos de los hooks
  const { groups = [], individuals = [] } = useTravelers();
  const { hostels = [] } = useHostels();

  // Get assignments data and functions from React Query hooks - pass partnerId
  const {
    assignments = [],
    assignGroup,
    removeAssignment,
    refetch: refetchAssignments,
    isLoading: isLoadingAssignments,
  } = useAssignmentsByDate(selectedDate, selectedPartner?.id);

  // Get assigned hostels for the selected partner
  const { assignedHostels = [], isLoading: isLoadingAssignedHostels } =
    useHostelAssignments(selectedPartner?.id);

  // Filter the hostels to only include those assigned to the selected partner
  const assignedHostelIds = useMemo(() => {
    return assignedHostels.map((assignment) => assignment.hostel_id);
  }, [assignedHostels]);

  // Filter the hostels list to only show those assigned to the selected partner
  const filteredHostels = useMemo(() => {
    // If no partner is selected or no hostel assignments, return an empty array
    if (!selectedPartner?.id || assignedHostelIds.length === 0) return [];

    // Otherwise, filter the hostels to only include those assigned to the partner
    return hostels.filter((hostel) => assignedHostelIds.includes(hostel.id));
  }, [hostels, assignedHostelIds, selectedPartner?.id]);

  // Añadir un efecto para refrescar datos cuando la fecha cambia
  useEffect(() => {
    const loadAssignmentsForDate = async () => {
      // Solo cargar si tenemos un partner seleccionado
      if (!selectedPartner?.id) {
        return;
      }

      // Forzar un refetch inmediato para asegurar datos actualizados
      try {
        const freshData = await refetchAssignments();

        if (freshData.data && Array.isArray(freshData.data)) {
          // Construir un nuevo estado de asignaciones basado en los datos refrescados
          const groupStatus = {};
          const individualStatus = {};

          freshData.data.forEach((assignment) => {
            if (assignment.type === "group" && assignment.groupId) {
              groupStatus[assignment.groupId] = true;
            } else if (
              assignment.type === "individual" &&
              assignment.individualId
            ) {
              individualStatus[assignment.individualId] = true;
            }
          });

          // Actualizar el estado manual con los datos refrescados
          setManualAssignmentStatus({
            groups: groupStatus,
            individuals: individualStatus,
          });
        }
      } catch (error) {
        console.error("Error refreshing assignments:", error);
        toast.error("Error al cargar asignaciones");
      }
    };

    loadAssignmentsForDate();
  }, [selectedDate, refetchAssignments, selectedPartner?.id]); // Added selectedPartner?.id as dependency

  // Añadir un efecto para escuchar cambios de partner
  useEffect(() => {
    const handlePartnerChange = () => {
      // Refrescar todas las consultas relevantes
      queryClient.invalidateQueries({ queryKey: travelerKeys.all });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });

      // Forzar un refetch de asignaciones
      refetchAssignments();
    };

    window.addEventListener("partner-changed", handlePartnerChange);

    return () => {
      window.removeEventListener("partner-changed", handlePartnerChange);
    };
  }, [refetchAssignments, queryClient]);

  // Optimización: Calcular las asignaciones en memoria combinando asignaciones actuales y estado manual
  const checkedEntities = useMemo(() => {
    const groupStatus = { ...manualAssignmentStatus.groups };
    const individualStatus = { ...manualAssignmentStatus.individuals };

    // Procesar todas las asignaciones existentes
    for (const assignment of assignments) {
      if (assignment.type === "group" && assignment.groupId) {
        groupStatus[assignment.groupId] = true;
      } else if (assignment.type === "individual" && assignment.individualId) {
        individualStatus[assignment.individualId] = true;
      }
    }

    return {
      groups: groupStatus,
      individuals: individualStatus,
    };
  }, [assignments, manualAssignmentStatus]);

  const formattedDate = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  // Add a function to validate room capacity
  const validateRoomCapacity = useCallback(
    (draggedId, roomId) => {
      // Extract type and ID from the dragged element
      const [type, ...idParts] = draggedId.split("-");
      const entityId = idParts.join("-");

      // Skip validation for individuals (assuming they always fit)
      if (type !== "group") {
        return { hasCapacity: true };
      }

      // Find the group and room
      const group = groups.find((g) => g.id === entityId);
      const room = hostels
        .flatMap((h) => h.rooms || [])
        .find((r) => r.id === roomId);

      if (!group || !room) {
        console.error("Group or room not found:", {
          groupId: entityId,
          roomId,
        });
        return {
          hasCapacity: false,
          error: "Grupo o habitación no encontrados",
        };
      }

      // Get room capacity
      const roomCapacity = room.capacity || 0;

      // Calculate current occupancy
      let currentOccupancy = 0;

      // Get all assignments for this room
      const roomAssignments = assignments.filter((a) => a.roomId === roomId);

      // Calculate current occupancy by adding up all group sizes and individual counts
      roomAssignments.forEach((assignment) => {
        if (assignment.type === "group" && assignment.entity?.size) {
          currentOccupancy += parseInt(assignment.entity.size) || 0;
        } else if (assignment.type === "individual") {
          currentOccupancy += 1;
        }
      });

      // Calculate remaining capacity
      const remainingCapacity = roomCapacity - currentOccupancy;

      // Check if there's enough space for the group
      const hasCapacity = remainingCapacity >= (parseInt(group.size) || 0);

      return {
        hasCapacity,
        remainingCapacity,
        requestedSpace: group.size,
        roomCapacity,
      };
    },
    [groups, hostels, assignments]
  );

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const [type, ...idParts] = active.id.split("-");

    if (type === "group") {
      const validation = validateRoomCapacity(active.id, over.id);

      if (!validation.hasCapacity) {
        toast("No hay suficiente espacio", {
          description: `Espacio disponible: ${validation.remainingCapacity} personas. Necesitas: ${validation.requestedSpace} personas.`,
          duration: 3000,
        });
      }
    }
  };

  // Add a new function to process assignments and map them to rooms for display
  const processRoomAssignments = useMemo(() => {
    const roomAssignments = {};

    // Skip if loading or no assignments
    if (isLoadingAssignments || !assignments.length) {
      return roomAssignments;
    }

    // Group assignments by roomId for easier access
    assignments.forEach((assignment) => {
      if (!assignment.roomId) return;

      if (!roomAssignments[assignment.roomId]) {
        roomAssignments[assignment.roomId] = [];
      }

      roomAssignments[assignment.roomId].push(assignment);
    });

    return roomAssignments;
  }, [assignments, isLoadingAssignments]);

  // Modify handleDragEnd to implement better optimistic updates
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      toast.error("Suelta el grupo en una habitación válida");
      return;
    }

    try {
      // Get entity details
      const [type, ...idParts] = active.id.split("-");
      const entityId = idParts.join("-");

      // Check if entity is already assigned - prevent duplicate assignments
      if (
        (type === "group" && checkedEntities.groups[entityId]) ||
        (type === "individual" && checkedEntities.individuals[entityId])
      ) {
        toast.error(
          `Este ${
            type === "group" ? "grupo" : "individuo"
          } ya está asignado a una habitación`
        );
        return;
      }

      // Validate room capacity for groups
      if (type === "group") {
        const validation = validateRoomCapacity(active.id, over.id);

        if (!validation.hasCapacity) {
          toast.error(`No hay espacio suficiente en la habitación`, {
            description: `Capacidad disponible: ${validation.remainingCapacity}/${validation.roomCapacity}. Tamaño del grupo: ${validation.requestedSpace}`,
          });
          return;
        }
      }

      const entity =
        type === "group"
          ? groups.find((g) => g.id === entityId)
          : individuals.find((i) => i.id === entityId);
      const room = hostels
        .flatMap((h) => h.rooms || [])
        .find((r) => r.id === over.id);

      if (!entity || !room) {
        throw new Error("No se pudo encontrar la entidad o la habitación");
      }

      // Show toast for optimistic update
      toast.info(
        `Asignando ${
          type === "group" ? "grupo" : "persona"
        } a la habitación...`,
        { id: "assignment-progress", duration: 1000 }
      );

      // Generar un ID temporal pero consistente basado en datos determinísticos
      const tempId = `temp-${type}-${entityId}-${room.id}-${format(
        selectedDate,
        "yyyyMMdd"
      )}`;

      // Add partner context to the optimistic assignment
      const optimisticAssignment = {
        id: tempId,
        roomId: room.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        type: type,
        groupId: type === "group" ? entityId : null,
        individualId: type === "individual" ? entityId : null,
        entity: {
          ...JSON.parse(JSON.stringify(entity)),
          partner_id: selectedPartner.id, // Ensure partner context is included
        },
        isOptimistic: true,
      };

      // Update UI immediately with optimistic assignment
      const currentAssignments = [...assignments, optimisticAssignment];

      // Update the assignments cache with optimistic data
      queryClient.setQueryData(
        assignmentKeys.byDateAndPartner(
          format(selectedDate, "yyyy-MM-dd"),
          selectedPartner.id
        ),
        currentAssignments
      );

      // Also update the general assignments cache by date
      queryClient.setQueryData(
        assignmentKeys.byDate(format(selectedDate, "yyyy-MM-dd")),
        (oldAssignments = []) => {
          // Remove any temporary assignments for this entity to avoid duplicates
          const filtered = oldAssignments.filter(
            (a) =>
              !(
                a.isOptimistic &&
                ((type === "group" && a.groupId === entityId) ||
                  (type === "individual" && a.individualId === entityId))
              )
          );
          return [...filtered, optimisticAssignment];
        }
      );

      // Update entity's assigned status in the cache
      if (type === "group") {
        // Update groups cache
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          (oldGroups = []) =>
            oldGroups.map((g) =>
              g.id === entityId ? { ...g, isAssigned: true } : g
            )
        );

        // Also update the partner's groups
        queryClient.setQueryData(
          ["partners", selectedPartner.id, "groups"],
          (oldGroups = []) =>
            oldGroups.map((g) =>
              g.id === entityId ? { ...g, isAssigned: true } : g
            )
        );
      } else {
        // Update individuals cache
        queryClient.setQueryData(
          travelerKeys.individuals.lists(),
          (oldIndividuals = []) =>
            oldIndividuals.map((i) =>
              i.id === entityId ? { ...i, isAssigned: true } : i
            )
        );

        // Also update the partner's individuals
        queryClient.setQueryData(
          ["partners", selectedPartner.id, "individuals"],
          (oldIndividuals = []) =>
            oldIndividuals.map((i) =>
              i.id === entityId ? { ...i, isAssigned: true } : i
            )
        );
      }

      // Manually update the local state for immediate UI update
      setManualAssignmentStatus((prevState) => {
        if (type === "group") {
          return {
            ...prevState,
            groups: { ...prevState.groups, [entityId]: true },
          };
        } else {
          return {
            ...prevState,
            individuals: { ...prevState.individuals, [entityId]: true },
          };
        }
      });

      // Execute the real assignment mutation in the background
      const realAssignment = await assignGroup({
        draggedId: active.id,
        roomId: over.id,
        date: selectedDate,
      });

      // Update the optimistic assignment with the real data
      queryClient.setQueryData(
        assignmentKeys.byDateAndPartner(
          format(selectedDate, "yyyy-MM-dd"),
          selectedPartner.id
        ),
        (oldAssignments = []) =>
          oldAssignments.map((assignment) =>
            assignment.id === tempId
              ? {
                  ...assignment,
                  id: realAssignment.id,
                  isOptimistic: false,
                  entity: realAssignment.entity, // Use the real entity data from server
                }
              : assignment
          )
      );

      // Also update the general cache
      queryClient.setQueryData(
        assignmentKeys.byDate(format(selectedDate, "yyyy-MM-dd")),
        (oldAssignments = []) =>
          oldAssignments.map((assignment) =>
            assignment.id === tempId
              ? {
                  ...assignment,
                  id: realAssignment.id,
                  isOptimistic: false,
                  entity: realAssignment.entity,
                }
              : assignment
          )
      );
    } catch (error) {
      // Revert optimistic updates
      toast.error(`Error al crear asignación: ${error.message}`, {
        id: "assignment-progress",
      });
      refetchAssignments();
      console.error("Error completo:", error);
    }
  };

  // Create a wrapper function around removeAssignment to update local state
  const handleRemoveAssignment = async (assignmentId) => {
    try {
      // Find the assignment before removing it to know which entity to unmark
      const assignmentToRemove = assignments.find((a) => a.id === assignmentId);

      if (!assignmentToRemove) {
        console.error("Assignment not found:", assignmentId);
        return;
      }

      // Call the original removeAssignment function
      await removeAssignment(assignmentId);

      // Update local state to mark entity as unassigned
      if (assignmentToRemove.type === "group" && assignmentToRemove.groupId) {
        setManualAssignmentStatus((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            [assignmentToRemove.groupId]: false, // Mark as unassigned
          },
        }));
      } else if (
        assignmentToRemove.type === "individual" &&
        assignmentToRemove.individualId
      ) {
        setManualAssignmentStatus((prev) => ({
          ...prev,
          individuals: {
            ...prev.individuals,
            [assignmentToRemove.individualId]: false, // Mark as unassigned
          },
        }));
      }
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Error al eliminar la asignación");
    }
  };

  // Add a new function for forced removal from full rooms
  const handleForceRemoval = async (assignmentId, roomId) => {
    try {
      // Use the new wrapper function instead of calling removeAssignment directly
      await handleRemoveAssignment(assignmentId);
    } catch (error) {
      console.error("Error al eliminar asignación:", error);
    }
  };

  // Replace the date change handler to use the global store
  const handleDateChange = (e) => {
    const newDateString = e.target.value;
    const newDate = new Date(newDateString + "T00:00:00");

    if (isNaN(newDate.getTime())) {
      toast.error("Fecha inválida");
      return;
    }

    // Mostrar indicador de carga
    toast.info("Cargando asignaciones...", {
      id: "loading-assignments",
      duration: 1500,
    });

    // Primero invalidar las consultas para la nueva fecha para forzar una recarga completa
    const newDateKey = format(newDate, "yyyy-MM-dd");

    // Invalidate with partner context when available
    if (selectedPartner?.id) {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byDateAndPartner(
          newDateKey,
          selectedPartner.id
        ),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byDate(newDateKey),
      });
    }

    // Limpiar el estado de asignaciones manuales
    setManualAssignmentStatus({
      groups: {},
      individuals: {},
    });

    // Actualizar la fecha en el store global
    setSelectedDate(newDate);
  };

  // Si no hay partner seleccionado, mostrar un mensaje
  if (!selectedPartner) {
    return (
      <ProtectedRoute>
        <div className="p-8 flex flex-col items-center justify-center h-[60vh]">
          <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-medium text-gray-700">
            No hay grupo seleccionado
          </h2>
          <p className="text-gray-500 mt-2">
            Selecciona o crea un grupo para gestionar asignaciones
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-primary mb-8">
            Asignación de Viajeros - {selectedPartner.name}
          </h1>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="flex gap-8">
              {/* Panel izquierdo de grupos e individuales */}
              <div className="w-1/4 space-y-6">
                {/* Mostrar skeleton o componente normal dependiendo del estado de carga */}
                {isLoadingAssignments ? (
                  <>
                    {/* Skeleton para el panel de grupos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5" />
                          Grupos Disponibles
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-16 w-full rounded-lg"
                          />
                        ))}
                      </CardContent>
                    </Card>

                    {/* Skeleton para el panel de individuales */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="h-5 w-5" />
                          Personas Individuales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[1, 2].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-12 w-full rounded-lg"
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <GroupsPanel
                      groups={groups}
                      assignedStatus={checkedEntities.groups}
                    />
                    <IndividualsPanel
                      individuals={individuals}
                      assignedStatus={checkedEntities.individuals}
                    />
                  </>
                )}
              </div>

              {/* Panel de albergues */}
              <div className="flex-1">
                <div className="space-y-6">
                  {isLoadingAssignments || isLoadingAssignedHostels ? (
                    // Mostrar skeletons para los hostels cuando está cargando
                    <>
                      {[1, 2].map((hostelIndex) => (
                        <Card key={`skeleton-hostel-${hostelIndex}`}>
                          <CardHeader>
                            <Skeleton className="h-6 w-40" />
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {[1, 2, 3, 4].map((roomIndex) => (
                                <Skeleton
                                  key={`skeleton-room-${roomIndex}`}
                                  className="h-24 w-full rounded-lg"
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : filteredHostels.length > 0 ? (
                    // Mostrar solo los hostels asignados al partner seleccionado
                    filteredHostels.map((hostel) => (
                      <Card key={hostel.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5" />
                            {hostel.name}
                          </CardTitle>

                          {/* Botón para descargar todas las habitaciones */}
                          <DownloadAllRoomsButton
                            hostel={hostel}
                            assignments={assignments}
                            checkedEntities={checkedEntities}
                            date={selectedDate}
                            entities={{ groups, individuals }}
                          />
                        </CardHeader>
                        <CardContent>
                          <HostelRooms
                            hostel={hostel}
                            assignments={assignments}
                            roomAssignments={processRoomAssignments} // Pass the processed assignments
                            removeAssignment={handleRemoveAssignment} // Pass the wrapper function instead
                            forceRemoval={handleForceRemoval} // Add the force removal handler
                            entities={{
                              groups, // Pasar los grupos completos
                              individuals, // Pasar los individuos completos
                            }}
                            date={selectedDate} // Pasar la fecha seleccionada
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Mostrar mensaje cuando no hay albergues asignados
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-center">
                          No hay albergues asignados a este partner
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          Usa la sección &ldquo;Asignación de Albergues&rdquo;
                          para asignar albergues a este partner
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </DndContext>
        </div>
      </div>
    </ProtectedRoute>
  );
}
