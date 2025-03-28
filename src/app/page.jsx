"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Building2, X, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";

import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

import { useDateStore } from "@/store/date-store";
import { useTravelerStore } from "@/store/travelerStore";
import { useHostelStore } from "@/store/hostelStore";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useHostelAssignmentStore } from "@/store/hostelAssignmentStore";

import { Draggable } from "@/components/dashboard/draggable";
import { Droppable } from "@/components/dashboard/droppable";
import { IndividualsPanel } from "@/components/dashboard/individuals-panel";
import { GroupsPanel } from "@/components/dashboard/groups-panel";
import { HostelRooms } from "@/components/dashboard/hostel-rooms";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadAllRoomsButton } from "@/components/dashboard/download-all-rooms-button";

export default function Dashboard() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  const [manualAssignmentStatus, setManualAssignmentStatus] = useState({
    groups: {},
    individuals: {},
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const { selectedPartner, groups, individuals } = useTravelerStore();

  const {
    hostels,
    isLoading: isLoadingHostels,
    fetchHostels,
  } = useHostelStore();

  const {
    isLoading: isLoadingAssignments,
    fetchAssignmentsByDate,
    createAssignment,
    deleteAssignment,
    addOptimisticAssignment,
    updateOptimisticAssignment,
  } = useAssignmentStore();

  const { fetchPartnerAssignments, isLoading: isLoadingAssignedHostels } =
    useHostelAssignmentStore();

  // Direct access to assignments without useMemo
  const assignments =
    selectedPartner?.id && selectedDate
      ? useAssignmentStore
          .getState()
          .getAssignmentsByDateAndPartner(selectedDate, selectedPartner.id)
      : [];

  // Get assigned hostels without useMemo
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const assignedHostels =
    selectedPartner?.id && dateStr
      ? useHostelAssignmentStore
          .getState()
          .getPartnerAssignments(selectedPartner.id, dateStr)
      : [];

  // Extract hostel IDs directly
  const assignedHostelIds = assignedHostels.map(
    (assignment) => assignment.hostel_id
  );

  // Filter hostels directly
  const filteredHostels =
    !selectedPartner?.id || assignedHostelIds.length === 0
      ? []
      : hostels.filter((hostel) => assignedHostelIds.includes(hostel.id));

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  useEffect(() => {
    if (selectedPartner?.id && selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Fetch assignment data for the current partner and date
      fetchAssignmentsByDate(selectedDate, selectedPartner.id);
      fetchPartnerAssignments(selectedPartner.id, dateStr);

      // Reset assignment status to avoid stale UI state
      setManualAssignmentStatus({
        groups: {},
        individuals: {},
      });
    }
  }, [
    selectedDate,
    selectedPartner?.id,
    fetchAssignmentsByDate,
    fetchPartnerAssignments,
  ]);

  // Calculate checked entities directly
  const groupStatus = { ...manualAssignmentStatus.groups };
  const individualStatus = { ...manualAssignmentStatus.individuals };

  // Process all existing assignments
  for (const assignment of assignments) {
    if (assignment.type === "group" && assignment.groupId) {
      groupStatus[assignment.groupId] = true;
    } else if (assignment.type === "individual" && assignment.individualId) {
      individualStatus[assignment.individualId] = true;
    }
  }

  const checkedEntities = {
    groups: groupStatus,
    individuals: individualStatus,
  };

  // Format date directly
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

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

      const roomCapacity = room.capacity || 0;

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
    }
  };

  // Handle drag end - create assignment
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

      // First update local state to prevent UI from allowing duplicate drags
      // while the server request is in progress
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

      // Execute the assignment directly without optimistic updates
      const realAssignment = await createAssignment(
        active.id,
        over.id,
        selectedDate
      );

      // Refresh assignments to ensure data consistency
      await fetchAssignmentsByDate(selectedDate, selectedPartner.id);
    } catch (error) {
      // Revert local state on error
      const [type, ...idParts] = active.id.split("-");
      const entityId = idParts.join("-");

      setManualAssignmentStatus((prevState) => {
        if (type === "group") {
          return {
            ...prevState,
            groups: { ...prevState.groups, [entityId]: false },
          };
        } else {
          return {
            ...prevState,
            individuals: { ...prevState.individuals, [entityId]: false },
          };
        }
      });

      // Show error toast
      toast.error(`Error al crear asignación: ${error.message}`, {
        id: "assignment-progress",
      });

      // Refresh data to ensure correct state
      fetchAssignmentsByDate(selectedDate, selectedPartner?.id);
      console.error("Error completo:", error);
    }
  };

  // Process room assignments directly, avoiding duplicates
  const processRoomAssignments = {};

  // Skip if loading or no assignments
  if (!isLoadingAssignments && assignments.length) {
    // Use a Map to track assignment IDs
    const processedAssignments = new Map();

    assignments.forEach((assignment) => {
      if (!assignment.roomId) return;

      // Skip if we've already processed this assignment
      if (processedAssignments.has(assignment.id)) return;
      processedAssignments.set(assignment.id, true);

      if (!processRoomAssignments[assignment.roomId]) {
        processRoomAssignments[assignment.roomId] = [];
      }

      processRoomAssignments[assignment.roomId].push(assignment);
    });
  }

  // Handle assignment removal
  const handleRemoveAssignment = async (assignmentId) => {
    try {
      // Find the assignment before removing it
      const assignmentToRemove = assignments.find((a) => a.id === assignmentId);

      if (!assignmentToRemove) {
        console.error("Assignment not found:", assignmentId);
        return;
      }

      // Call the delete assignment function from store
      await deleteAssignment(assignmentId);

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

  // Forced removal from full rooms
  const handleForceRemoval = async (assignmentId, roomId) => {
    try {
      await handleRemoveAssignment(assignmentId);
    } catch (error) {
      console.error("Error al eliminar asignación:", error);
    }
  };

  // Show empty state if no partner selected
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
            <div className="flex items-start gap-8 relative">
              {/* Left panel with groups and individuals */}
              <div className="w-1/4 space-y-6 sticky top-8 self-start">
                <GroupsPanel
                  groups={groups}
                  assignedStatus={checkedEntities.groups}
                />
                <IndividualsPanel
                  individuals={individuals}
                  assignedStatus={checkedEntities.individuals}
                />
              </div>

              {/* Hostels panel */}
              <div className="flex-1">
                <div className="space-y-6">
                  {filteredHostels.length > 0 ? (
                    // Show only hostels assigned to the selected partner
                    filteredHostels.map((hostel) => (
                      <Card key={hostel.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5" />
                            {hostel.name}
                          </CardTitle>

                          {/* Button to download all rooms */}
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
                            roomAssignments={processRoomAssignments} // Pass processed assignments
                            removeAssignment={handleRemoveAssignment}
                            forceRemoval={handleForceRemoval}
                            entities={{
                              groups, // Pass complete groups
                              individuals, // Pass complete individuals
                            }}
                            date={selectedDate} // Pass selected date
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Show message when no hostels are assigned
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-center">
                          No hay albergues asignados a este grupo
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          Usa la sección &ldquo;Asignación de Albergues&rdquo;
                          para asignar albergues a este grupo
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
