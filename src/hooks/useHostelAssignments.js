import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePartnerStore } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";

// Query keys for hostel assignments
export const hostelAssignmentKeys = {
  all: ["hostelAssignments"],
  lists: () => [...hostelAssignmentKeys.all, "list"],
  byPartnerId: (partnerId) => [...hostelAssignmentKeys.lists(), { partnerId }],
  byDate: (dateStr) => [...hostelAssignmentKeys.lists(), { date: dateStr }],
};

/**
 * Hook for managing multiple hostel assignments for partners
 */
export function useHostelAssignments(partnerId) {
  const queryClient = useQueryClient();
  const { setHostelAssignments, hostelAssignments: storeAssignments } =
    usePartnerStore();
  const dateStr = useDateStore((state) => state.dateStr);

  // Reset queries when date changes
  useEffect(() => {
    // When date changes, invalidate relevant queries
    if (partnerId) {
      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byPartnerId(partnerId),
      });
    }

    queryClient.invalidateQueries({
      queryKey: hostelAssignmentKeys.byDate(dateStr),
    });
  }, [dateStr, partnerId, queryClient]);

  // Query to fetch all hostel assignments for a partner
  const {
    data: assignedHostels = [],
    isLoading,
    error,
    refetch: refetchPartnerAssignments,
  } = useQuery({
    queryKey: hostelAssignmentKeys.byPartnerId(partnerId),
    queryFn: async () => {
      if (!partnerId) return [];

      const { data, error } = await supabase
        .from("hostel_partner_assignments")
        .select("*, hostel:hostels(*)")
        .eq("partner_id", partnerId)
        .eq("date", dateStr);

      if (error) {
        console.error("Error fetching partner assignments:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!partnerId && !!dateStr,
    keepPreviousData: false, // Don't keep stale data
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    onSuccess: (data) => {
      setHostelAssignments(data || []);
    },
  });

  // Query to fetch ALL hostel assignments for the current date
  const {
    data: allAssignmentsForDate = [],
    isLoading: isLoadingAllAssignments,
    refetch: refetchAllAssignments,
  } = useQuery({
    queryKey: hostelAssignmentKeys.byDate(dateStr),
    queryFn: async () => {
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

      if (error) {
        console.error("Error fetching all assignments:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!dateStr,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    onSuccess: (data) => {},
  });

  // Combined refetch function
  const refetch = async () => {
    const [partnerResults, allResults] = await Promise.all([
      refetchPartnerAssignments(),
      refetchAllAssignments(),
    ]);
    return { partnerResults, allResults };
  };

  // Helper function to check if a hostel is already assigned to any partner today
  const isHostelAssigned = (hostelId) => {
    return allAssignmentsForDate.some(
      (assignment) => assignment.hostel_id === hostelId
    );
  };

  // Helper function to get partner name for a hostel assignment
  const getPartnerForHostel = (hostelId) => {
    const assignment = allAssignmentsForDate.find(
      (a) => a.hostel_id === hostelId
    );
    return assignment?.partner;
  };

  // Add a new hostel assignment
  const addHostelAssignmentMutation = useMutation({
    mutationFn: async ({ hostelId }) => {
      if (!partnerId || !hostelId) {
        throw new Error("Partner ID and hostel ID are required");
      }

      // Check if hostel is already assigned to any partner today
      const existingAssignment = allAssignmentsForDate.find(
        (a) => a.hostel_id === hostelId && !a.id.toString().startsWith("temp-")
      );

      if (existingAssignment) {
        const partnerName = existingAssignment.partner?.name || "otro partner";
        throw new Error(`Este albergue ya está asignado a ${partnerName} hoy`);
      }

      // Create new assignment
      const { data, error } = await supabase
        .from("hostel_partner_assignments")
        .insert({
          partner_id: partnerId,
          hostel_id: hostelId,
          date: dateStr,
        })
        .select("*, hostel:hostels(*)")
        .single();

      if (error) {
        console.error("Assignment creation error:", error);
        throw error;
      }

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byDate(dateStr),
      });

      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byPartnerId(partnerId),
      });

      return data;
    },
    onSuccess: (newAssignment) => {
      // Success message
      const hostelName = newAssignment?.hostel?.name || "seleccionado";

      // Force refetch to update UI
      refetch();
    },
    onError: (err) => {
      toast.error("Error al asignar el albergue: " + err.message);
    },
  });

  // Remove a hostel assignment
  const removeHostelAssignmentMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const { error } = await supabase
        .from("hostel_partner_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        console.error("Error removing assignment:", error);
        throw error;
      }
      return { id: assignmentId };
    },
    onSuccess: () => {
      // Force refetch to update UI
      refetch();

      // Additionally invalidate queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: hostelAssignmentKeys.byDate(dateStr),
      });

      if (partnerId) {
        queryClient.invalidateQueries({
          queryKey: hostelAssignmentKeys.byPartnerId(partnerId),
        });
      }
    },
    onError: (err) => {},
  });

  return {
    assignedHostels,
    isLoading,
    error,
    refetch,
    addHostelAssignment: (hostelId) =>
      addHostelAssignmentMutation.mutateAsync({ hostelId }),
    removeHostelAssignment: (assignmentId) =>
      removeHostelAssignmentMutation.mutateAsync(assignmentId),
    isAdding: addHostelAssignmentMutation.isPending,
    isRemoving: removeHostelAssignmentMutation.isPending,
    // Add new properties
    allAssignmentsForDate,
    isLoadingAllAssignments,
    isHostelAssigned,
    getPartnerForHostel,
  };
}
