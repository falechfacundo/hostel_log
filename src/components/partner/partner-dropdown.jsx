import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ChevronDown, Trash2, Loader2, Pencil } from "lucide-react";

// Import stores directly
import { useAuthStore } from "@/store/authStore";
// import { usePartnerStore } from "@/store/partnerStore";
import { useTravelerStore } from "@/store/travelerStore";

export function PartnerDropdown({
  onDeletePartner,
  isDeleting,
  partnerToDelete,
  onEditPartner,
}) {
  // Get data directly from stores
  const partners = useTravelerStore((state) => state.partners);
  const isLoadingPartners = useTravelerStore((state) => state.isLoading);
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);
  const setSelectedPartner = useTravelerStore(
    (state) => state.setSelectedPartner
  );
  const setGroups = useTravelerStore((state) => state.setGroups);
  const setIndividuals = useTravelerStore((state) => state.setIndividuals);
  const userProfile = useAuthStore((state) => state.userProfile);

  // Check if component is disabled based on loading states
  const disabled = isLoadingPartners || isDeleting;

  // If current selection is not in the partners list, use the first partner if available
  useEffect(() => {
    if (
      partners.length > 0 &&
      (!selectedPartner ||
        !partners.some((p) => String(p.id) === String(selectedPartner.id)))
    ) {
      const firstAvailablePartner = partners[0];
      handleSelectPartner(firstAvailablePartner);
    }
  }, [selectedPartner, partners]);

  const handleSelectPartner = (partner) => {
    // Check if this is already the selected partner
    if (selectedPartner && partner.id === selectedPartner.id) {
      return;
    }

    // Update data in store
    setSelectedPartner(partner);
    if (partner.groups) setGroups(partner.groups);
    if (partner.individuals) setIndividuals(partner.individuals);
  };

  // Handle select change event
  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const partner = partners.find((p) => String(p.id) === String(selectedId));
    if (partner) {
      handleSelectPartner(partner);
    }
  };

  // Show a message if no partners available
  if (partners.length === 0) {
    return (
      <div className="flex-1 max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <select
            className="w-full py-2 pl-3 pr-10 border rounded-md bg-white appearance-none text-gray-500"
            disabled={true}
          >
            <option>No hay partners disponibles</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-md flex items-center gap-2">
      <div className="relative flex-1">
        <select
          className="w-full py-2 pl-3 pr-10 border rounded-md bg-white appearance-none"
          value={selectedPartner?.id || ""}
          onChange={handleSelectChange}
          disabled={disabled}
        >
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
      </div>

      {/* Botón para eliminar el partner seleccionado */}
      {selectedPartner && userProfile?.role === "admin" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              onEditPartner(selectedPartner);
            }}
            disabled={isDeleting}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Tooltip content="Eliminar partner">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeletePartner(selectedPartner)}
              className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Eliminar partner"
              disabled={disabled}
            >
              {isDeleting && partnerToDelete?.id === selectedPartner.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
