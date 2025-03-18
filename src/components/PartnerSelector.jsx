"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { DatePicker } from "@/components/dashboard/date-picker";
import { PartnerDropdown } from "@/components/partner/partner-dropdown";
import { PartnerInfo } from "@/components/partner/partner-info";
import { CreatePartnerDialog } from "@/components/partner/create-partner-dialog";
import { DeletePartnerDialog } from "@/components/partner/delete-partner-dialog";
import { format, addDays } from "date-fns";

import { queryClient } from "@/lib/queryClient";

import { useTravelers, travelerKeys } from "@/hooks/useTravelers";

import { usePartnerStore, selectedPartnerKey } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";
import { useAuthStore } from "@/store/authStore";

// Global variable to track last logged partner to prevent duplicate logs
let lastLoggedPartnerId = null;

// Memoize the component to prevent unnecessary renders
export function PartnerSelector({ onDateChange }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const userProfile = useAuthStore((state) => state.userProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Use our Zustand stores
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const setSelectedPartner = usePartnerStore(
    (state) => state.setSelectedPartner
  );
  const setGroups = usePartnerStore((state) => state.setGroups);
  const setIndividuals = usePartnerStore((state) => state.setIndividuals);

  // Usar el store de fechas
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  // Use the hook to get partners data and functions
  const {
    partners,
    isLoading: isLoadingPartners,
    addPartner,
    deletePartner,
    refetchPartners, // Add this to destructure refetchPartners
  } = useTravelers(selectedDate); // Pasamos la fecha del store

  // Log only when partner actually changes
  const previousPartnerIdRef = useRef(selectedPartner?.id);
  useEffect(() => {
    if (
      selectedPartner?.id !== previousPartnerIdRef.current &&
      selectedPartner?.id !== lastLoggedPartnerId
    ) {
      previousPartnerIdRef.current = selectedPartner?.id;
      lastLoggedPartnerId = selectedPartner?.id;
    }
  }, [selectedPartner?.id]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDateChange = useCallback(
    (e) => {
      const newDateString = e.target.value;
      const newDate = new Date(newDateString + "T00:00:00");

      if (isNaN(newDate.getTime())) {
        // toast.error("Fecha inválida");
        return;
      }

      // Show loading indicator
      // toast.info("Cargando datos para la fecha seleccionada...", {
      //   id: "loading-date-change",
      //   duration: 1500,
      // });

      // Actualizar la fecha en el store global
      setSelectedDate(newDate);

      // Invalidate queries for the new date
      const newDateKey = format(newDate, "yyyy-MM-dd");

      // Just invalidate the query - this will trigger a refetch automatically
      // since we're using the useTravelers hook with the selectedDate
      queryClient.invalidateQueries({
        queryKey: [...travelerKeys.all, { date: newDateKey }],
      });

      // After a short delay to allow the query to refetch, check for updated data
      setTimeout(() => {
        // If the selected partner still exists, update its data from cache
        if (selectedPartner?.id) {
          try {
            // Try to get fresh data from the cache after refetch
            console.log("Checking for updated partner data in cache...");

            const data = queryClient.getQueryData([
              ...travelerKeys.all,
              { date: newDateKey },
            ]);
            if (data) {
              console.log("Found data in cache:", data);

              const updatedPartner = data.find(
                (p) => p.id === selectedPartner.id
              );
              if (updatedPartner) {
                console.log(
                  "Updating partner data from cache:",
                  updatedPartner
                );

                setSelectedPartner(updatedPartner);
                if (updatedPartner.groups) setGroups(updatedPartner.groups);
                if (updatedPartner.individuals)
                  setIndividuals(updatedPartner.individuals);
              }
            }
          } catch (error) {
            console.error("Error updating partner data from cache:", error);
          }
        }
      }, 500); // Short delay to allow refetch to complete
    },
    [
      setSelectedDate,
      selectedPartner?.id,
      setSelectedPartner,
      setGroups,
      setIndividuals,
    ]
  );

  const handleCreatePartner = useCallback(
    async (partnerData) => {
      try {
        setIsCreatingPartner(true);

        // Don't clear existing partner data when creating a new one
        // This prevents affecting the partners dropdown
        const { name, size, days, startDate } = partnerData;
        const startDateObj = startDate || new Date();
        const formattedStartDate = format(startDateObj, "yyyy-MM-dd");

        // Calculate end date by adding days to start date
        const daysCount = parseInt(days) || 5;
        const endDateObj = addDays(startDateObj, daysCount);
        const formattedEndDate = format(endDateObj, "yyyy-MM-dd");

        // Create the new partner
        const newPartner = await addPartner({
          name,
          size: parseInt(size) || 0,
          days: daysCount,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        });

        // Invalidate the cache AND explicitly refetch partners for the current date
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        queryClient.invalidateQueries({
          queryKey: [...travelerKeys.all, { date: dateKey }],
        });

        // Explicitly refetch partners to ensure the new partner appears in the list
        await refetchPartners(selectedDate);

        setCreateDialogOpen(false);

        return true;
      } catch (error) {
        toast.error(`Error al crear partner: ${error.message}`);
        return false;
      } finally {
        setIsCreatingPartner(false);
      }
    },
    [
      addPartner,
      selectedDate,
      refetchPartners,
      setSelectedPartner,
      setGroups,
      setIndividuals,
    ]
  );

  const handleDeletePartner = useCallback((partner) => {
    setPartnerToDelete(partner);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!partnerToDelete?.id) return;

    try {
      setIsDeletingPartner(true);

      // Store the partner we're deleting and get next available partner
      const partnerBeingDeletedId = partnerToDelete.id;
      const otherPartners = partners.filter(
        (p) => p.id !== partnerBeingDeletedId
      );
      const nextPartner = otherPartners.length > 0 ? otherPartners[0] : null;

      // Call the API to delete the partner - this will trigger optimistic updates
      await deletePartner(partnerBeingDeletedId);

      // If the deleted partner was selected
      if (selectedPartner?.id === partnerBeingDeletedId) {
        if (nextPartner) {
          // If we have another partner, select it
          setSelectedPartner(nextPartner);
          if (nextPartner.groups) setGroups(nextPartner.groups);
          if (nextPartner.individuals) setIndividuals(nextPartner.individuals);
        } else {
          setSelectedPartner(null);
          setGroups([]);
          setIndividuals([]);
        }
      }

      // Close dialog
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
      console.log("Partner deleted successfully:", selectedPartner);
    } catch (error) {
      console.log("Error deleting partner:", error);
    } finally {
      setIsDeletingPartner(false);
    }
  }, [
    deletePartner,
    partnerToDelete,
    partners,
    selectedPartner,
    setSelectedPartner,
    setGroups,
    setIndividuals,
  ]);

  // Use the store's setSelectedPartner directly
  const handleSelectPartner = useCallback(
    (partner) => {
      if (!partner) return;

      // Actualizar el partner seleccionado en el store
      setSelectedPartner(partner);

      // Actualizar grupos e individuos en el store
      if (partner.groups) setGroups(partner.groups);
      if (partner.individuals) setIndividuals(partner.individuals);

      // Posiblemente mostrar notificación
      // toast.success(`Partner seleccionado: ${partner.name}`);
    },
    [setSelectedPartner, setGroups, setIndividuals]
  );

  // Fix the conditional rendering here
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-between py-2 px-4 bg-white border-b">
        <div className="flex items-center gap-4">
          {/* Dropdown de partners */}
          <PartnerDropdown
            partners={partners || []}
            selectedPartner={selectedPartner}
            onSelectPartner={handleSelectPartner}
            onDeletePartner={handleDeletePartner}
            isDeleting={isDeletingPartner}
            disabled={
              isLoadingPartners || isCreatingPartner || isDeletingPartner
            }
            partnerToDelete={partnerToDelete}
          />
          {/* Botón para crear nuevo partner */}
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

        {/* Información del partner seleccionado */}
        <div className="flex items-center gap-2">
          <PartnerInfo partner={selectedPartner} />
        </div>

        {/* Diálogos */}
        {userProfile?.role === "admin" && (
          <>
            <CreatePartnerDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onCreatePartner={handleCreatePartner}
              creating={isCreatingPartner}
            />

            <DeletePartnerDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              partner={partnerToDelete || selectedPartner}
              onConfirmDelete={handleConfirmDelete}
              deleting={isDeletingPartner}
            />
          </>
        )}

        {/* Selector de fecha - ahora con la fecha del store */}
        <DatePicker date={selectedDate} onChange={handleDateChange} />
      </div>
    );
  }

  return <></>;
}
