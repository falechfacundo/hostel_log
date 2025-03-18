import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";

import { queryClient } from "@/lib/queryClient";

import { usePartnerStore } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";

import { useHostels } from "@/hooks/useHostels";
import {
  useHostelAssignments,
  hostelAssignmentKeys,
} from "@/hooks/useHostelAssignments";

export function HostelAssignment() {
  const { selectedPartner, hostelAssignments: storeAssignments } =
    usePartnerStore();
  const { dateStr } = useDateStore();
  const {
    hostels,
    isLoading: isLoadingHostels,
    refetch: refetchHostels,
  } = useHostels();

  const [selectedHostel, setSelectedHostel] = useState("");

  // Use our modified hook that now returns more data
  const {
    assignedHostels,
    isLoading,
    addHostelAssignment,
    removeHostelAssignment,
    isAdding,
    isRemoving,
    // Add new properties for all assignments
    allAssignmentsForDate,
    isLoadingAllAssignments,
    isHostelAssigned,
    getPartnerForHostel,
    refetch,
  } = useHostelAssignments(selectedPartner?.id);

  // Reset selected hostel when partner changes
  useEffect(() => {
    setSelectedHostel("");
  }, [selectedPartner?.id]);

  // Debug log the assignments
  useEffect(() => {
    console.log("Current partner assignedHostels:", assignedHostels);
    console.log("All assignments for date:", allAssignmentsForDate);
    console.log("Current date:", dateStr);

    // Force refetch when date or partner changes
    const doRefetch = async () => {
      try {
        await refetch();
        console.log("Refetched assignments");
      } catch (error) {
        console.error("Error refetching:", error);
      }
    };

    doRefetch();
  }, [dateStr, selectedPartner?.id, refetch]);

  // Use direct query results to ensure we have fresh data
  const displayedAssignments = assignedHostels;

  // Get list of already assigned hostel IDs for current partner
  const assignedHostelIds = displayedAssignments.map(
    (assignment) => assignment.hostel_id
  );

  // Process all assignments for display
  // Make sure we're using the same partner IDs in both sections
  const processedAssignments = [...allAssignmentsForDate];

  // Add any partner-specific assignments that might be missing
  if (displayedAssignments.length > 0) {
    // Check if each partner assignment exists in allAssignments
    displayedAssignments.forEach((assignment) => {
      const exists = processedAssignments.some((a) => a.id === assignment.id);
      if (!exists) {
        console.log(
          "Adding missing assignment to all assignments:",
          assignment
        );
        processedAssignments.push(assignment);
      }
    });
  }

  // Group all assignments by partner and add partner size info
  const assignmentsByPartner = processedAssignments.reduce(
    (groups, assignment) => {
      const partnerId = assignment.partner_id;

      // If this is the current partner but partner data is missing (for some reason),
      // use the selectedPartner data
      let partnerName = assignment.partner?.name;
      let partnerSize = assignment.partner?.size || 0;

      if (partnerId === selectedPartner?.id) {
        partnerName = partnerName || selectedPartner.name;
        partnerSize = partnerSize || selectedPartner.size || 0;
      } else {
        partnerName = partnerName || "Partner desconocido";
      }

      if (!groups[partnerId]) {
        groups[partnerId] = {
          name: partnerName,
          size: partnerSize,
          assignments: [],
        };
      }

      groups[partnerId].assignments.push(assignment);
      return groups;
    },
    {}
  );

  // Fix for empty when there are assignments
  const hasAssignments =
    displayedAssignments.length > 0 ||
    Object.keys(assignmentsByPartner).length > 0;

  // Check if we need to add the current partner to the list
  if (
    selectedPartner &&
    displayedAssignments.length > 0 &&
    !assignmentsByPartner[selectedPartner.id]
  ) {
    assignmentsByPartner[selectedPartner.id] = {
      name: selectedPartner.name,
      size: selectedPartner.size || 0,
      assignments: displayedAssignments,
    };
  }

  const handleAddHostel = async () => {
    if (!selectedPartner?.id || !selectedHostel) {
      toast.error("Selecciona un albergue para asignar");
      return;
    }

    try {
      await addHostelAssignment(selectedHostel);
      // Reset the select after adding
      setSelectedHostel("");
      // Optionally refetch hostels if their state might have changed
      refetchHostels();

      // Force refetch all assignments to make sure both sections are updated
      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byDate(dateStr),
      });
    } catch (error) {
      console.error("Error adding hostel:", error);
    }
  };

  // Modified handler for removing a hostel assignment from any partner
  const handleRemoveHostel = async (assignmentId, isCurrentPartner = true) => {
    try {
      await removeHostelAssignment(assignmentId);

      // Refetch hostels to update availability
      refetchHostels();

      // Always invalidate both queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byDate(dateStr),
      });

      if (selectedPartner?.id) {
        queryClient.invalidateQueries({
          queryKey: hostelAssignmentKeys.byPartnerId(selectedPartner.id),
        });
      }
    } catch (error) {
      console.error("Error removing hostel:", error);
    }
  };

  // Filter out already assigned hostels from the select options
  // Now checks against ALL assignments for the date, not just this partner's
  const availableHostels = hostels.filter(
    (hostel) => !isHostelAssigned(hostel.id)
  );

  // If no partner selected, don't render anything
  if (!selectedPartner) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Asignación de Albergues</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && displayedAssignments.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando asignaciones...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display current partner's assignments */}
            {displayedAssignments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Asignar albergues a grupo: {selectedPartner.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayedAssignments.map((assignment) => (
                    <Badge
                      key={assignment.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-2 px-3"
                    >
                      {assignment.hostel?.name || "Desconocido"}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full ml-1"
                        onClick={() => handleRemoveHostel(assignment.id)}
                        disabled={isRemoving}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mb-2">
                No hay albergues asignados a {selectedPartner.name}
              </div>
            )}

            {/* Selector for adding new hostel assignments */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Asignar Nuevo Albergue
                </label>
                <div className="flex gap-2">
                  <Select
                    value={selectedHostel}
                    onValueChange={setSelectedHostel}
                    disabled={isAdding || isLoadingHostels}
                    className="flex-1"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar albergue" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHostels.length > 0 ? (
                        availableHostels.map((hostel) => (
                          <SelectItem key={hostel.id} value={hostel.id}>
                            {hostel.name} ({hostel.capacity} plazas)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No hay albergues disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddHostel}
                    disabled={
                      isAdding ||
                      !selectedHostel ||
                      availableHostels.length === 0
                    }
                    className="whitespace-nowrap"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Asignar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Show all assignments for today grouped by partner */}
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-3">
                Todas las asignaciones de hoy ({dateStr}):
              </h3>
              {isLoadingAllAssignments ? (
                <div className="flex items-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Cargando...</span>
                </div>
              ) : Object.keys(assignmentsByPartner).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(assignmentsByPartner).map(
                    ([partnerId, data]) => (
                      <div key={partnerId} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">{data.name}</h4>
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                            {data.size} personas
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {data.assignments.map((assignment) => (
                            <Badge
                              key={assignment.id}
                              variant={
                                assignment.partner_id === selectedPartner?.id
                                  ? "default"
                                  : "outline"
                              }
                              className="py-1 px-2 flex items-center gap-1"
                            >
                              <span>
                                {assignment.hostel?.name || "Desconocido"}
                              </span>
                              <span className="text-xs bg-background text-foreground px-1.5 py-0.5 rounded-full ml-1">
                                {assignment.hostel?.capacity || "?"} plazas
                              </span>
                              {/* Add delete button for all assignments */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full ml-1"
                                onClick={() =>
                                  handleRemoveHostel(
                                    assignment.id,
                                    assignment.partner_id ===
                                      selectedPartner?.id
                                  )
                                }
                                disabled={isRemoving}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {hasAssignments
                    ? "Sincronizando asignaciones..."
                    : "No hay asignaciones de albergues hoy"}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
