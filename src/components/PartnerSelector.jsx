"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { DatePicker } from "@/components/dashboard/date-picker";
import { PartnerDropdown } from "@/components/partner/partner-dropdown";
import { PartnerInfo } from "@/components/partner/partner-info";
import { CreatePartnerDialog } from "@/components/partner/create-partner-dialog";
import { DeletePartnerDialog } from "@/components/partner/delete-partner-dialog";

// Import Zustand stores
// import { usePartnerStore } from "@/store/partnerStore";
import { useTravelerStore } from "@/store/travelerStore";
import { useDateStore } from "@/store/date-store";
import { useAuthStore } from "@/store/authStore";
import { useHostelAssignmentStore } from "@/store/hostelAssignmentStore";
import { useAssignmentStore } from "@/store/assignmentStore";

// Global variable to track last logged partner to prevent duplicate logs
let lastLoggedPartnerId = null;

export function PartnerSelector() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States that still need to be managed at this level
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);

  // Access user data from auth store
  const userProfile = useAuthStore((state) => state.userProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Store access for our main component logic
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);
  const clearPartnerStoreData = useTravelerStore(
    (state) => state.clearStoreData
  );
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);
  const { refetchPartners } = useTravelerStore();
  const clearHostelCache = useHostelAssignmentStore(
    (state) => state.clearCache
  );
  const clearAssignmentCache = useAssignmentStore((state) => state.clearCache);
  const partners = useTravelerStore((state) => state.partners);
  const fetchPartnersByDate = useTravelerStore(
    (state) => state.fetchPartnersByDate
  );

  // Handle refresh data
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);

      // 1. Clear all cached data from stores
      clearPartnerStoreData(); // Clear partner data
      clearHostelCache(); // Clear hostel assignments
      clearAssignmentCache(); // Clear room assignments

      // 2. Refetch partners with forceRefresh flag
      const refreshedPartners = await fetchPartnersByDate(selectedDate, true);

      // 3. If we have a selected partner, make sure to select it again with fresh data
      if (selectedPartner?.id) {
        // Find the partner in the refreshed data
        const updatedPartner = refreshedPartners.find(
          (p) => p.id === selectedPartner.id
        );
        if (updatedPartner) {
          // Re-select the partner with updated data to refresh groups and individuals
          useTravelerStore.getState().setSelectedPartner(updatedPartner);

          // Explicitly refresh groups and individuals for this partner
          const filteredIndividuals = useTravelerStore
            .getState()
            .individuals.filter(
              (ind) =>
                ind.partner_id === updatedPartner.id &&
                (!ind.group_id || ind.group_id === null)
            );

          const filteredGroups = useTravelerStore
            .getState()
            .groups.filter((grp) => grp.partner_id === updatedPartner.id);

          useTravelerStore.getState().setGroups(filteredGroups);
          useTravelerStore.getState().setIndividuals(filteredIndividuals);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Error al actualizar datos: " + error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Combined useEffect for tracking partner changes and refreshing data
  useEffect(() => {
    // Skip if we don't have a partner ID
    if (!selectedPartner?.id) return;

    // Update last logged partner ID for tracking
    if (selectedPartner.id !== lastLoggedPartnerId) {
      lastLoggedPartnerId = selectedPartner.id;
    }
  }, [selectedPartner?.id]);

  // Fetch partners when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchPartnersByDate(selectedDate);
    }
  }, [selectedDate, fetchPartnersByDate]);

  // Handle date change
  const handleDateChange = useCallback(
    (e) => {
      const newDateString = e.target.value;
      const newDate = new Date(newDateString + "T00:00:00");

      if (isNaN(newDate.getTime())) {
        return;
      }

      // Update global date store - the useEffect will handle data fetching
      setSelectedDate(newDate);
    },
    [setSelectedDate]
  );

  // Handle opening delete dialog
  const handleOpenDeleteDialog = useCallback((partner) => {
    setPartnerToDelete(partner);
    setDeleteDialogOpen(true);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-2 px-4 bg-white border-b">
      <div className="flex items-center gap-4">
        {/* Partners dropdown - No props needed now */}
        <PartnerDropdown
          onDeletePartner={handleOpenDeleteDialog}
          isDeleting={isDeletingPartner}
          partnerToDelete={partnerToDelete}
        />

        {/* Create new partner button */}
        {userProfile?.role === "admin" && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="ghost"
            size="sm"
            className="ml-2"
            disabled={isCreatingPartner || isDeletingPartner}
          >
            <Plus className="h-4 w-4 mr-1" />
          </Button>
        )}

        {/* Refresh button */}
        <Button
          onClick={handleRefreshData}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          title="Recargar datos"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Partner information - No props needed now */}
      <div className="flex items-center gap-2">
        <PartnerInfo />
      </div>

      {/* Dialogs */}
      {userProfile?.role === "admin" && (
        <>
          <CreatePartnerDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            creating={isCreatingPartner}
            setCreating={setIsCreatingPartner}
          />

          <DeletePartnerDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            partner={partnerToDelete}
            deleting={isDeletingPartner}
            setDeleting={setIsDeletingPartner}
            setPartnerToDelete={setPartnerToDelete}
          />
        </>
      )}

      {/* Date picker with date from store */}
      <DatePicker date={selectedDate} onChange={handleDateChange} />
    </div>
  );
}
