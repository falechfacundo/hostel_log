"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { DatePicker } from "@/components/dashboard/date-picker";
import { PartnerDropdown } from "@/components/partner/partner-dropdown";
import { PartnerInfo } from "@/components/partner/partner-info";
import { CreatePartnerDialog } from "@/components/partner/create-partner-dialog";
import { DeletePartnerDialog } from "@/components/partner/delete-partner-dialog";

// Import Zustand stores
import { usePartnerStore } from "@/store/partnerStore";
import { useTravelerStore } from "@/store/travelerStore";
import { useDateStore } from "@/store/date-store";
import { useAuthStore } from "@/store/authStore";

// Global variable to track last logged partner to prevent duplicate logs
let lastLoggedPartnerId = null;

export function PartnerSelector() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // States that still need to be managed at this level
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);

  // Access user data from auth store
  const userProfile = useAuthStore((state) => state.userProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Store access for our main component logic
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);
  const partners = useTravelerStore((state) => state.partners);
  const fetchPartnersByDate = useTravelerStore(
    (state) => state.fetchPartnersByDate
  );

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
