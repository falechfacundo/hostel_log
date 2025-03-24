import { useState, useEffect, useRef, useMemo } from "react";

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

// Import Zustand stores
import { usePartnerStore } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";
import { useHostelStore } from "@/store/hostelStore";
import { useHostelAssignmentStore } from "@/store/hostelAssignmentStore";

export function HostelAssignment() {
  // Use a ref to track initial load to prevent double fetching
  const initialLoadCompleted = useRef(false);

  // Add separate loading states for specific operations
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isRemovingAssignment, setIsRemovingAssignment] = useState({});

  // Get partner data via single selector to avoid re-renders
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);

  // Get date in formatted string form for consistent dependency tracking
  const selectedDate = useDateStore((state) => state.selectedDate);
  const dateStr = useMemo(() => {
    return selectedDate
      ? new Date(selectedDate).toISOString().split("T")[0]
      : "";
  }, [selectedDate]);

  // Get hostel store state
  const hostels = useHostelStore((state) => state.hostels);
  const isLoadingHostels = useHostelStore((state) => state.isLoading);
  const fetchHostels = useHostelStore((state) => state.fetchHostels);

  const [selectedHostel, setSelectedHostel] = useState("");

  // Get hostelAssignmentStore state and actions - always call hooks unconditionally
  const fetchPartnerAssignments = useHostelAssignmentStore(
    (state) => state.fetchPartnerAssignments
  );
  const fetchAllAssignments = useHostelAssignmentStore(
    (state) => state.fetchAllAssignments
  );
  const addHostelAssignment = useHostelAssignmentStore(
    (state) => state.addHostelAssignment
  );
  const removeHostelAssignment = useHostelAssignmentStore(
    (state) => state.removeHostelAssignment
  );
  const isHostelAssigned = useHostelAssignmentStore(
    (state) => state.isHostelAssigned
  );
  const getPartnerForHostel = useHostelAssignmentStore(
    (state) => state.getPartnerForHostel
  );
  const isLoading = useHostelAssignmentStore((state) => state.isLoading);

  // Get all assignments - call hooks unconditionally (fix for linter error)
  const partnerAssignments = useHostelAssignmentStore(
    (state) => state.partnerAssignments
  );
  const allAssignments = useHostelAssignmentStore(
    (state) => state.allAssignments
  );

  // Then access the data using proper memoization AFTER the hooks
  const displayedAssignments = useMemo(() => {
    if (!selectedPartner?.id || !dateStr) return [];
    const key = `${selectedPartner.id}-${dateStr}`;
    return partnerAssignments[key] || [];
  }, [partnerAssignments, selectedPartner?.id, dateStr]);

  // Process all assignments with useMemo
  const processedAssignments = useMemo(() => {
    return dateStr ? allAssignments[dateStr] || [] : [];
  }, [allAssignments, dateStr]);

  // Reset selected hostel when partner changes
  useEffect(() => {
    setSelectedHostel("");
  }, [selectedPartner?.id]);

  // Fetch assignments with fixed dependencies and load tracking
  useEffect(() => {
    if (!dateStr) return;

    // Exit early if we already completed the initial load for this date
    if (initialLoadCompleted.current === dateStr) return;

    const loadAssignments = async () => {
      try {
        // First fetch all assignments for this date (always needed)
        await fetchAllAssignments(dateStr);

        // If there's a selected partner, fetch their assignments too
        if (selectedPartner?.id) {
          await fetchPartnerAssignments(selectedPartner.id, dateStr);
        }

        // Mark initial load as completed for this date
        initialLoadCompleted.current = dateStr;
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    loadAssignments();
  }, [
    dateStr,
    selectedPartner?.id,
    fetchAllAssignments,
    fetchPartnerAssignments,
  ]);

  // Get list of already assigned hostel IDs with proper memoization
  const assignedHostelIds = useMemo(() => {
    return displayedAssignments.map((assignment) => assignment.hostel_id);
  }, [displayedAssignments]);

  // Group all assignments by partner and add partner size info with memoization
  const assignmentsByPartner = useMemo(() => {
    return processedAssignments.reduce((groups, assignment) => {
      const partnerId = assignment.partner_id;

      // If this is the current partner but partner data is missing,
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
    }, {});
  }, [processedAssignments, selectedPartner]);

  // Fix for empty when there are assignments - with memoization
  const hasAssignments = useMemo(() => {
    return (
      displayedAssignments.length > 0 ||
      Object.keys(assignmentsByPartner).length > 0
    );
  }, [displayedAssignments, assignmentsByPartner]);

  // Ensure selected partner is properly included in assignmentsByPartner
  useEffect(() => {
    if (
      selectedPartner &&
      displayedAssignments.length > 0 &&
      !assignmentsByPartner[selectedPartner.id]
    ) {
      // This will be handled in the useMemo for assignmentsByPartner
      // We don't need to manually update state here
    }
  }, [selectedPartner, displayedAssignments, assignmentsByPartner]);

  const handleAddHostel = async () => {
    if (!selectedPartner?.id || !selectedHostel) {
      toast.error("Selecciona un albergue para asignar");
      return;
    }

    try {
      // Use local loading state instead of global state
      setIsAddingAssignment(true);

      await addHostelAssignment(selectedPartner.id, selectedHostel, dateStr);

      // Reset the select after adding
      setSelectedHostel("");

      // Refresh data to make sure we have the latest - this updates through the store
      await fetchAllAssignments(dateStr);
      if (selectedPartner?.id) {
        await fetchPartnerAssignments(selectedPartner.id, dateStr);
      }
    } catch (error) {
      console.error("Error adding hostel:", error);
      toast.error(`Error al asignar albergue: ${error.message}`);
    } finally {
      setIsAddingAssignment(false);
    }
  };

  // Handler for removing a hostel assignment
  const handleRemoveHostel = async (assignmentId, isCurrentPartner = true) => {
    try {
      // Use local tracking for specific assignment
      setIsRemovingAssignment((prev) => ({ ...prev, [assignmentId]: true }));

      await removeHostelAssignment(assignmentId);

      // Refresh data to make sure we have the latest - this updates through the store
      await fetchAllAssignments(dateStr);
      if (selectedPartner?.id) {
        await fetchPartnerAssignments(selectedPartner.id, dateStr);
      }
    } catch (error) {
      console.error("Error removing hostel:", error);
      toast.error(`Error al eliminar asignación: ${error.message}`);
    } finally {
      setIsRemovingAssignment((prev) => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
    }
  };

  // Filter out already assigned hostels - with memoization
  const availableHostels = useMemo(() => {
    return hostels.filter((hostel) => !isHostelAssigned(hostel.id, dateStr));
  }, [hostels, isHostelAssigned, dateStr]);

  // If no partner selected, don't render anything
  if (!selectedPartner) return null;

  // Initial loading state for first data fetch
  const isInitialLoading =
    isLoading &&
    displayedAssignments.length === 0 &&
    Object.keys(assignmentsByPartner).length === 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Asignación de Albergues</CardTitle>
      </CardHeader>
      <CardContent>
        {isInitialLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando asignaciones...</span>
          </div>
        ) : (
          <div className="space-y-4">
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
                    disabled={isAddingAssignment || isLoadingHostels}
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
                      isAddingAssignment ||
                      !selectedHostel ||
                      availableHostels.length === 0
                    }
                    className="whitespace-nowrap"
                  >
                    {isAddingAssignment ? (
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
              {Object.keys(assignmentsByPartner).length > 0 ? (
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
                                disabled={isRemovingAssignment[assignment.id]}
                              >
                                {isRemovingAssignment[assignment.id] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
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
