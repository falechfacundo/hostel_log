"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/dashboard/date-picker";
import { Loader2, Calendar, Pencil } from "lucide-react";

import { useTravelerStore } from "@/store/travelerStore";

export function EditPartnerDialog({
  open,
  onOpenChange,
  partner,
  editing,
  setEditing,
}) {
  const updatePartner = useTravelerStore((state) => state.updatePartner);

  const [editedPartner, setEditedPartner] = useState({
    name: "",
    size: "1",
    days: "1",
    startDate: new Date(),
  });

  // Set form values when partner changes
  useEffect(() => {
    if (partner) {
      setEditedPartner({
        name: partner.name || "",
        size: partner.size || "1",
        days: partner.days || "1",
        startDate: partner.start_date
          ? parse(partner.start_date, "yyyy-MM-dd", new Date())
          : new Date(),
      });
    }
  }, [partner]);

  const handleStartDateChange = (e) => {
    try {
      const newDateString = e.target.value;
      const newDate = new Date(newDateString);
      if (!isNaN(newDate.getTime())) {
        setEditedPartner({
          ...editedPartner,
          startDate: newDate,
        });
      }
    } catch (error) {
      console.error("Error setting date:", error);
    }
  };

  const handleUpdatePartner = async () => {
    if (!editedPartner.name.trim()) {
      toast.error("El nombre del partner es requerido");
      return;
    }

    try {
      setEditing(true);

      if (!partner?.id) {
        toast.error("No se puede actualizar: ID del partner no disponible");
        return;
      }

      await updatePartner(partner.id, editedPartner);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Error al actualizar partner: ${error.message}`);
      console.error(error);
    } finally {
      setEditing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Partner</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="partnerName">Nombre del Partner</Label>
            <Input
              id="partnerName"
              value={editedPartner.name}
              onChange={(e) =>
                setEditedPartner({ ...editedPartner, name: e.target.value })
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
                min="1"
                value={editedPartner.size}
                onChange={(e) =>
                  setEditedPartner({ ...editedPartner, size: e.target.value })
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
                value={editedPartner.days}
                onChange={(e) =>
                  setEditedPartner({ ...editedPartner, days: e.target.value })
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
              date={editedPartner.startDate}
              onChange={handleStartDateChange}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={editing}
          >
            Cancelar
          </Button>
          <Button onClick={handleUpdatePartner} disabled={editing}>
            {editing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
