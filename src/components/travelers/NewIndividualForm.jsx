"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Loader2, Check, Backpack } from "lucide-react";
import { toast } from "sonner";

import { format } from "date-fns";

export function NewIndividualForm({ onAddIndividual }) {
  const [name, setName] = useState("");
  const [hasBackpack, setHasBackpack] = useState(false);
  const [addedPersons, setAddedPersons] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar la adición de una persona
  const handleAddPerson = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    // Añadir la persona a la lista temporal con el estado de la mochila y fechas
    setAddedPersons([
      ...addedPersons,
      {
        name: name.trim(),
        backpack: hasBackpack,
      },
    ]);

    // Limpiar el campo para la siguiente persona
    setName("");

    // Enfocar el campo de entrada para continuar añadiendo
    document.getElementById("personName").focus();
  };

  // Manejar el guardado final
  const handleSubmitAll = async () => {
    if (addedPersons.length === 0) {
      toast.error("Añade al menos una persona");
      return;
    }

    setIsSubmitting(true);

    try {
      // Agregar todas las personas a la base de datos
      for (const person of addedPersons) {
        await onAddIndividual(person);
      }

      // Limpiar la lista después de guardar
      setAddedPersons([]);

      // Opcional: cerrar el diálogo después de guardar
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar la eliminación de una persona de la lista temporal
  const handleRemovePerson = (index) => {
    const newList = [...addedPersons];
    newList.splice(index, 1);
    setAddedPersons(newList);
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Formulario para añadir una persona a la vez */}
        <form onSubmit={handleAddPerson} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="personName">Nombre de la persona</Label>
              <Input
                id="personName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la persona"
                className="w-full"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBackpack"
                checked={hasBackpack}
                onCheckedChange={(checked) => setHasBackpack(!!checked)}
              />
              <label
                htmlFor="hasBackpack"
                className="text-sm flex items-center cursor-pointer"
              >
                <Backpack className="h-4 w-4 mr-1 text-muted-foreground" />
                Tiene mochila
              </label>
            </div>

            <Button type="submit" size="sm" className="ml-auto">
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
        </form>

        {/* Lista de personas añadidas temporalmente */}
        {addedPersons.length > 0 && (
          <div className="border rounded-md p-2">
            <h3 className="text-sm font-medium mb-2">
              Personas a añadir ({addedPersons.length}):
            </h3>
            <ul className="max-h-[200px] overflow-y-auto space-y-1">
              {addedPersons.map((person, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center py-1 px-2 hover:bg-muted/50 rounded-sm text-sm"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{person.name}</span>
                      {person.backpack && (
                        <Backpack className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemovePerson(index)}
                  >
                    <span className="sr-only">Eliminar</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón para guardar */}
        <div className="pt-2">
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmitAll}
            disabled={addedPersons.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {addedPersons.length > 0
                  ? `Guardar ${addedPersons.length} ${
                      addedPersons.length === 1 ? "persona" : "personas"
                    }`
                  : "Guardar personas"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
