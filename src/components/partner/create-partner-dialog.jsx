import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/dashboard/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

// Import stores directly
import { useTravelerStore } from "@/store/travelerStore";
import { usePartnerStore } from "@/store/partnerStore";
import { useDateStore } from "@/store/date-store";
import { format } from "date-fns";

export function CreatePartnerDialog({
  open,
  onOpenChange,
  creating,
  setCreating,
}) {
  // Get store functions
  const createPartner = useTravelerStore((state) => state.createPartner);
  const fetchPartnersByDate = useTravelerStore(
    (state) => state.fetchPartnersByDate
  );
  const setSelectedPartner = usePartnerStore(
    (state) => state.setSelectedPartner
  );
  const setGroups = usePartnerStore((state) => state.setGroups);
  const setIndividuals = usePartnerStore((state) => state.setIndividuals);
  const selectedDate = useDateStore((state) => state.selectedDate);

  const [newPartner, setNewPartner] = useState({
    name: "",
    size: "0",
    days: "5",
    startDate: new Date(),
  });

  const handleStartDateChange = (e) => {
    try {
      const newDateString = e.target.value;
      const newDate = new Date(newDateString);
      if (!isNaN(newDate.getTime())) {
        setNewPartner({
          ...newPartner,
          startDate: newDate,
        });
      }
    } catch (error) {
      console.error("Error setting date:", error);
    }
  };

  const handleCreatePartner = async () => {
    if (!newPartner.name.trim()) {
      toast.error("El nombre del partner es requerido");
      return;
    }

    try {
      setCreating(true);

      const { name, size, days, startDate } = newPartner;
      const startDateObj = startDate || new Date();
      const formattedStartDate = format(startDateObj, "yyyy-MM-dd");

      // Calculate end date by adding days to start date
      const daysCount = parseInt(days) || 5;

      // Create the new partner using the store method
      const newPartnerData = await createPartner({
        name,
        size: parseInt(size) || 0,
        days: daysCount,
        startDate: startDateObj,
      });

      // Refresh partners for the current date
      await fetchPartnersByDate(selectedDate);

      // Automatically select the new partner
      setSelectedPartner(newPartnerData);
      setGroups(newPartnerData.groups || []);
      setIndividuals(newPartnerData.individuals || []);

      // Reset form
      setNewPartner({
        name: "",
        size: "0",
        days: "5",
        startDate: new Date(),
      });

      onOpenChange(false);
      return true;
    } catch (error) {
      toast.error(`Error al crear partner: ${error.message}`);
      return false;
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Partner</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="partnerName">Nombre del Partner</Label>
            <Input
              id="partnerName"
              value={newPartner.name}
              onChange={(e) =>
                setNewPartner({ ...newPartner, name: e.target.value })
              }
              placeholder="Nombre del partner"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="partnerSize">Cantidad de Integrantes</Label>
              <Input
                id="partnerSize"
                type="number"
                min="0"
                value={newPartner.size}
                onChange={(e) =>
                  setNewPartner({ ...newPartner, size: e.target.value })
                }
                placeholder="Cantidad de integrantes"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partnerDays">Días de Estadía</Label>
              <Input
                id="partnerDays"
                type="number"
                min="1"
                value={newPartner.days}
                onChange={(e) =>
                  setNewPartner({ ...newPartner, days: e.target.value })
                }
                placeholder="Días de estadía"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="partnerStartDate"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Fecha de Inicio</span>
            </Label>
            <DatePicker
              date={newPartner.startDate}
              onChange={handleStartDateChange}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreatePartner} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Partner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
