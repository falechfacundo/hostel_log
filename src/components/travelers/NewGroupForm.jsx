"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Trash2, Backpack, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NewGroupForm({ onAddGroup, partnerId, partnerName }) {
  const [groupMembers, setGroupMembers] = useState([
    { name: "", backpack: false },
    { name: "", backpack: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const addMember = () => {
    setGroupMembers([...groupMembers, { name: "", backpack: false }]);
  };

  const removeMember = (index) => {
    // Prevent removing if it would result in less than 2 members
    if (groupMembers.length <= 2) {
      return;
    }
    const newMembers = [...groupMembers];
    newMembers.splice(index, 1);
    setGroupMembers(newMembers);
  };

  const updateMemberName = (index, name) => {
    const newMembers = [...groupMembers];
    newMembers[index].name = name;
    setGroupMembers(newMembers);

    // Limpiar error si el campo es válido
    if (name.trim()) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[`member-${index}`];
        return updated;
      });
    }
  };

  const toggleMemberBackpack = (index) => {
    const newMembers = [...groupMembers];
    newMembers[index].backpack = !newMembers[index].backpack;
    setGroupMembers(newMembers);
  };

  const validateForm = () => {
    const errors = {};

    // Validar que al menos dos miembros tengan nombre
    const validMembers = groupMembers.filter(
      (member) => member.name.trim() !== ""
    );
    if (validMembers.length < 2) {
      errors.members = "Se requieren al menos dos miembros en el grupo";
    }

    // Validar cada miembro individualmente
    groupMembers.forEach((member, index) => {
      if (!member.name.trim() && index < 3) {
        // Solo validar los primeros 3 miembros
        errors[`member-${index}`] = "Nombre requerido";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    // Filter out empty member names
    const validMembers = groupMembers.filter(
      (member) => member.name.trim() !== ""
    );

    if (validMembers.length < 2) {
      toast.error("Se requieren al menos dos miembros en el grupo");
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddGroup({
        people: validMembers,
        partnerId: partnerId, // Asegurarse de pasar el partnerId
      });

      // Reset form state
      setGroupMembers([
        { name: "", backpack: false },
        { name: "", backpack: false },
      ]);
      setValidationErrors({});
    } catch (error) {
      console.log("Error al crear grupo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mostrar el partner al que se asignará el grupo */}
        {partnerName && (
          <div className="text-sm text-muted-foreground">
            Este grupo será asignado al partner:{" "}
            <span className="font-medium">{partnerName}</span>
          </div>
        )}

        {/* Miembros del grupo */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className={validationErrors.members ? "text-red-500" : ""}>
              Miembros del Grupo
              {validationErrors.members && (
                <span className="ml-1 text-xs">*</span>
              )}
            </Label>
            <Button
              type="button"
              onClick={addMember}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir</span>
            </Button>
          </div>

          {validationErrors.members && (
            <p className="text-red-500 text-xs mb-2">
              {validationErrors.members}
            </p>
          )}

          <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
            {groupMembers.map((member, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    value={member.name}
                    onChange={(e) => updateMemberName(index, e.target.value)}
                    placeholder={`Persona ${index + 1}`}
                    className={`flex-1 ${
                      validationErrors[`member-${index}`]
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeMember(index)}
                    variant="destructive"
                    size="icon"
                    disabled={groupMembers.length <= 2}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {validationErrors[`member-${index}`] && (
                  <p className="text-red-500 text-xs">
                    {validationErrors[`member-${index}`]}
                  </p>
                )}
                <div className="flex items-center space-x-2 ml-1">
                  <Checkbox
                    id={`member-backpack-${index}`}
                    checked={member.backpack}
                    onCheckedChange={() => toggleMemberBackpack(index)}
                  />
                  <label
                    htmlFor={`member-backpack-${index}`}
                    className="text-xs flex items-center cursor-pointer"
                  >
                    <Backpack className="h-3 w-3 mr-1 text-muted-foreground" />
                    Tiene mochila
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Grupo"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
