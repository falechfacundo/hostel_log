import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useTravelerStore } from "@/store/travelerStore";
import { usePartnerStore } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";

export function DeletePartnerDialog({
  open,
  onOpenChange,
  partner,
  deleting,
  setDeleting,
  setPartnerToDelete,
}) {
  // Get store functions and values
  const deletePartner = useTravelerStore((state) => state.deletePartner);
  const fetchPartnersByDate = useTravelerStore(
    (state) => state.fetchPartnersByDate
  );
  const partners = useTravelerStore((state) => state.partners);
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const setSelectedPartner = usePartnerStore(
    (state) => state.setSelectedPartner
  );
  const setGroups = usePartnerStore((state) => state.setGroups);
  const setIndividuals = usePartnerStore((state) => state.setIndividuals);
  const selectedDate = useDateStore((state) => state.selectedDate);

  const handleOpenChange = (open) => {
    if (!deleting) {
      onOpenChange(open);
    }
  };

  const handleConfirmDelete = async () => {
    if (!partner?.id) return;

    try {
      setDeleting(true);

      // Store the partner we're deleting and get next available partner
      const partnerBeingDeletedId = partner.id;
      const otherPartners = partners.filter(
        (p) => p.id !== partnerBeingDeletedId
      );
      const nextPartner = otherPartners.length > 0 ? otherPartners[0] : null;

      // Delete the partner
      await deletePartner(partnerBeingDeletedId);

      // Update partners list
      await fetchPartnersByDate(selectedDate);

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
      onOpenChange(false);
      setPartnerToDelete(null);
    } catch (error) {
      console.log("Error deleting partner:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Eliminar Partner
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar el partner &quot;{partner?.name}
            &quot;? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-red-500 font-medium">
            ¡Advertencia! Se eliminarán todos los datos asociados a este
            partner:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
            <li>Todos los grupos asignados a este partner</li>
            <li>Todas las personas individuales vinculadas</li>
            <li>Todas las asignaciones de albergues</li>
          </ul>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Partner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
