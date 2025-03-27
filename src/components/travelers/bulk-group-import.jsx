"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Users, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useTravelerStore } from "@/store/travelerStore";

export function BulkGroupImport() {
  // State for groups
  const [groupText, setGroupText] = useState("");
  const [groupPreview, setGroupPreview] = useState([]);

  // State for individuals
  const [individualText, setIndividualText] = useState("");
  const [individualPreview, setIndividualPreview] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Get the necessary functions from the store
  const totalPersons = useTravelerStore((state) => state.totalPersons);
  const maxPersons = useTravelerStore((state) => state.maxPersons);
  const createGroup = useTravelerStore((state) => state.createGroup);
  const createIndividual = useTravelerStore((state) => state.createIndividual);
  // Get the selected partner from the partner store
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);

  const parseGroups = (text) => {
    // Dividir por líneas y limpiar espacios
    const lines = text.split("\n").map((line) => line.trim());
    const groups = [];
    let currentGroup = [];

    lines.forEach((line) => {
      // Si la línea está vacía y tenemos un grupo actual, guardarlo
      if (line === "" && currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
      // Si la línea tiene contenido, agregarla al grupo actual
      else if (line !== "") {
        currentGroup.push(line);
      }
    });

    // Agregar el último grupo si existe
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const parseIndividuals = (text) => {
    // Split by lines, trim whitespace, and filter out empty lines
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  };

  const handleGroupTextChange = (e) => {
    const newText = e.target.value;
    setGroupText(newText);
    // Actualizar vista previa de grupos
    setGroupPreview(parseGroups(newText));
  };

  const handleIndividualTextChange = (e) => {
    const newText = e.target.value;
    setIndividualText(newText);
    // Actualizar vista previa de individuales
    setIndividualPreview(parseIndividuals(newText));
  };

  const processImport = async () => {
    const parsedGroups = parseGroups(groupText);
    const parsedIndividuals = parseIndividuals(individualText);

    if (parsedGroups.length === 0 && parsedIndividuals.length === 0) {
      toast.error("No hay datos para importar");
      return;
    }

    setIsImporting(true);

    try {
      // Import groups
      let importedGroupCount = 0;
      for (const members of parsedGroups) {
        const groupData = {
          notes: `${members.length} personas`,
          people: members.map((name) => ({
            name: name.trim(),
          })),
          partnerId: selectedPartner.id,
        };

        await createGroup(groupData);
        importedGroupCount++;
      }

      // Import individuals
      let importedIndividualCount = 0;
      for (const name of parsedIndividuals) {
        const individualData = {
          name: name.trim(),
          partnerId: selectedPartner.id,
        };

        await createIndividual(individualData);
        importedIndividualCount++;
      }

      // Forzar una actualización final del estado para asegurar datos correctos
      // Obtenemos el estado actual del travelerStore y filtramos los grupos e individuos
      // para el partner seleccionado
      const travelerStore = useTravelerStore.getState();
      const partnerGroups = travelerStore.groups.filter(
        (g) => g.partner_id === selectedPartner.id
      );
      const partnerIndividuals = travelerStore.individuals.filter(
        (i) => i.partner_id === selectedPartner.id
      );

      // // Actualizamos el partnerStore con los datos filtrados
      // const traveStore = useTravelerStore.getState();
      // partnerStore.setGroups(partnerGroups);
      // partnerStore.setIndividuals(partnerIndividuals);

      // Reset state
      setGroupText("");
      setIndividualText("");
      setGroupPreview([]);
      setIndividualPreview([]);
      setIsOpen(false);
    } catch (error) {
      toast.error(`Error al importar datos: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-fuchsia-pink-500 hover:bg-fuchsia-pink-600 gap-2"
          disabled={
            totalPersons == maxPersons - 1 || totalPersons == maxPersons
          }
        >
          <Upload className="h-4 w-4" />
          Importar desde Texto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>Importar Viajeros desde Texto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Panel de entrada */}
          <div className="space-y-6">
            {/* Sección de grupos */}
            <div className="space-y-2">
              <h3 className="font-medium">Grupos</h3>
              <div className="text-sm text-gray-600">
                <p>Instrucciones:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Una persona por línea</li>
                  <li>Línea en blanco para separar grupos</li>
                  <li>Minimo 2 personas</li>
                </ul>
              </div>
              <Textarea
                placeholder="SONIA SERRAS&#10;ESTER FERNANDEZ&#10;JESUS RODRIGUEZ&#10;&#10;MARIA BOIX GUILABERT&#10;TANIA MATO SANCHEZ"
                value={groupText}
                onChange={handleGroupTextChange}
                className="h-[180px] font-mono"
              />
            </div>

            {/* Sección de individuales */}
            <div className="space-y-2">
              <h3 className="font-medium">Personas Individuales</h3>
              <div className="text-sm text-gray-600">
                <p>Instrucciones:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Una persona por línea</li>
                  <li>Sin agrupación</li>
                </ul>
              </div>
              <Textarea
                placeholder="CARLOS MARTIN&#10;LUCIA TORRES&#10;PEDRO SÁNCHEZ"
                value={individualText}
                onChange={handleIndividualTextChange}
                className="h-[180px] font-mono"
              />
            </div>
          </div>

          {/* Panel de vista previa */}
          <div className="border-l pl-4 w-full">
            <h3 className="font-medium mb-4">Vista Previa:</h3>
            <div className="space-y-5 max-h-[400px] overflow-y-auto ">
              {/* Vista previa de grupos */}
              {groupPreview.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Grupos ({groupPreview.length})
                  </h4>
                  <div className="space-y-3">
                    {groupPreview.map((group, groupIndex) => (
                      <div key={groupIndex} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">
                            Grupo {groupIndex + 1}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({group.length} personas)
                          </span>
                        </div>
                        <ul className="text-sm space-y-1">
                          {group.map((person, personIndex) => (
                            <li key={personIndex} className="text-gray-600">
                              {person}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista previa de individuales */}
              {individualPreview.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Personas Individuales ({individualPreview.length})
                  </h4>
                  <ul className="text-sm space-y-1 border rounded-lg p-3">
                    {individualPreview.map((person, index) => (
                      <li key={index} className="text-gray-600">
                        {person}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mensaje si no hay nada para importar */}
              {groupPreview.length === 0 && individualPreview.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <p>
                    Agrega personas en los campos de texto para ver la vista
                    previa
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 mt-4">
          <div className="text-sm text-gray-500">
            <span className="text-black block">
              Capacidad maxima del grupo {selectedPartner.size} personas
            </span>
            {(groupPreview.length !== 0 || individualPreview.length !== 0) && (
              <span className="text-red-600 block">
                Personas importadas:{" "}
                {groupPreview.reduce((acc, group) => acc + group.length, 0) +
                  individualPreview.length}{" "}
                / {maxPersons - totalPersons}
              </span>
            )}
            {groupPreview.length > 0 && (
              <span>{groupPreview.length} grupos • </span>
            )}
            {individualPreview.length > 0 && (
              <span>{individualPreview.length} individuales</span>
            )}
            {groupPreview.length === 0 && individualPreview.length === 0 && (
              <span>No hay datos para importar</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={processImport}
              disabled={
                maxPersons - totalPersons <
                  groupPreview.reduce((acc, group) => acc + group.length, 0) +
                    individualPreview.length ||
                groupPreview.some((group) => group.length === 1) ||
                (groupPreview.length === 0 && individualPreview.length === 0) ||
                isImporting
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importar Todo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
