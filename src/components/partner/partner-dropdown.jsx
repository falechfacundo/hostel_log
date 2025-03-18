import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ChevronDown, Trash2, Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

export function PartnerDropdown({
  partners,
  selectedPartner,
  onSelectPartner,
  onDeletePartner,
  isDeleting,
  partnerToDelete,
  disabled,
}) {
  // Estado local para mantener una selección optimista
  const [optimisticSelection, setOptimisticSelection] = useState(null);
  const [filteredPartners, setFilteredPartners] = useState(partners);
  const userProfile = useAuthStore((state) => state.userProfile);

  // Keep filtered partners in sync with incoming partners
  useEffect(() => {
    setFilteredPartners(partners);
  }, [partners]);

  // Determinar qué partner mostrar en el dropdown (el optimista o el real)
  const displayPartner = optimisticSelection || selectedPartner;

  // If current selection is not in the partners list, use the first partner if available
  useEffect(() => {
    if (
      displayPartner &&
      partners.length > 0 &&
      !partners.some((p) => p.id === displayPartner.id)
    ) {
      const firstAvailablePartner = partners[0];
      onSelectPartner(firstAvailablePartner);
    }
  }, [displayPartner, partners, onSelectPartner]);

  const handleSelectPartner = (e) => {
    const selectedId = e.target.value;

    // Avoid unnecessary work if no value selected
    if (!selectedId) return;

    // Find the partner with this ID
    const partner = partners.find((p) => String(p.id) === String(selectedId));

    if (!partner) return;

    // Check if this is already the selected partner
    if (selectedPartner && partner.id === selectedPartner.id) {
      console.log("Partner already selected:", partner.name);
      return;
    }

    // Actualización optimista de la UI
    setOptimisticSelection(partner);

    // Llamar a onSelectPartner después de la actualización local
    onSelectPartner(partner);

    // Limpiar la selección optimista después de un tiempo
    setTimeout(() => setOptimisticSelection(null), 500);
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
          value={displayPartner?.id || ""}
          onChange={handleSelectPartner}
          disabled={disabled || isDeleting}
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
      {displayPartner && userProfile?.role == "admin" && (
        <Tooltip content="Eliminar partner">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeletePartner(displayPartner)}
            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Eliminar partner"
            disabled={disabled || isDeleting}
          >
            {isDeleting && partnerToDelete?.id === displayPartner.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
