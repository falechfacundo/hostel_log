"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Import the store to get traveler data
import { useTravelerStore } from "@/store/travelerStore";
// API functions
const createGroupViaAPI = async (groupData) => {
  const response = await fetch("/api/travelers/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(groupData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al crear grupo");
  }

  return await response.json();
};

const createIndividualViaAPI = async (individualData) => {
  const response = await fetch("/api/travelers/individuals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(individualData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al crear viajero individual");
  }

  return await response.json();
};

export default function NewBulkImportPage() {
  // State for groups
  const [groupText, setGroupText] = useState("");
  const [groupPreview, setGroupPreview] = useState([]);

  // State for individuals
  const [individualText, setIndividualText] = useState("");
  const [individualPreview, setIndividualPreview] = useState([]);

  const [isImporting, setIsImporting] = useState(false);

  // Get the necessary data from the store
  const totalPersons = useTravelerStore((state) => state.totalPersons);
  const maxPersons = useTravelerStore((state) => state.maxPersons);
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);
  const setTotalPersons = useTravelerStore((state) => state.setTotalPersons);

  const parseGroups = (text) => {
    const lines = text.split("\n").map((line) => line.trim());
    const groups = [];
    let currentGroup = [];

    lines.forEach((line) => {
      if (line === "" && currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      } else if (line !== "") {
        currentGroup.push(line);
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const parseIndividuals = (text) => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  };

  const handleGroupTextChange = (e) => {
    const newText = e.target.value;
    setGroupText(newText);
    setGroupPreview(parseGroups(newText));
  };

  const handleIndividualTextChange = (e) => {
    const newText = e.target.value;
    setIndividualText(newText);
    setIndividualPreview(parseIndividuals(newText));
  };

  const processImport = async () => {
    const parsedGroups = parseGroups(groupText);
    const parsedIndividuals = parseIndividuals(individualText);

    if (parsedGroups.length === 0 && parsedIndividuals.length === 0) {
      toast.error("No hay datos para importar");
      return;
    }

    if (!selectedPartner || !selectedPartner.id) {
      toast.error("No hay socio seleccionado");
      return;
    }

    setIsImporting(true);

    try {
      // Import groups
      let importedGroupCount = 0;
      let importedPeopleCount = 0;

      // Track success and failures
      const results = {
        success: 0,
        failed: 0,
        groups: 0,
        individuals: 0,
      };

      // Calculate the total number of people to be imported
      const totalImportCount =
        parsedGroups.reduce((acc, group) => acc + group.length, 0) +
        parsedIndividuals.length;

      // Process groups
      for (const members of parsedGroups) {
        try {
          const groupData = {
            size: members.length,
            people: members.map((name) => ({
              name: name.trim(),
            })),
            partnerId: selectedPartner.id,
          };

          await createGroupViaAPI(groupData);
          importedGroupCount++;
          importedPeopleCount += members.length;
          results.success += members.length;
          results.groups++;
        } catch (error) {
          console.error("Error importing group:", error);
          results.failed += members.length;
          toast.error(`Error al importar un grupo: ${error.message}`);
        }
      }

      // Import individuals
      for (const name of parsedIndividuals) {
        try {
          const individualData = {
            name: name.trim(),
            partnerId: selectedPartner.id,
          };

          await createIndividualViaAPI(individualData);
          importedPeopleCount++;
          results.success++;
          results.individuals++;
        } catch (error) {
          console.error("Error importing individual:", error);
          results.failed++;
          toast.error(`Error al importar a ${name}: ${error.message}`);
        }
      }

      // Update the total persons count in the travelerStore
      const newTotalPersons = totalPersons + importedPeopleCount;
      setTotalPersons(newTotalPersons);

      // Reset state
      setGroupText("");
      setIndividualText("");
      setGroupPreview([]);
      setIndividualPreview([]);
    } catch (error) {
      toast.error(`Error al importar datos: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Importar Viajeros desde Texto</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              className="h-[250px] font-mono"
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
              className="h-[250px] font-mono"
            />
          </div>
        </div>

        {/* Panel de vista previa */}
        <div className="border-l pl-8">
          <h3 className="font-medium mb-4">Vista Previa:</h3>
          <div className="space-y-5 max-h-[550px] overflow-y-auto pr-4">
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

          <div className="mt-6">
            <div className="text-sm text-gray-500 mb-4">
              {selectedPartner && (
                <span className="text-black block">
                  Capacidad maxima del grupo {selectedPartner.size} personas
                </span>
              )}
              {(groupPreview.length !== 0 ||
                individualPreview.length !== 0) && (
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

            <Button
              onClick={processImport}
              disabled={
                !selectedPartner ||
                maxPersons - totalPersons <
                  groupPreview.reduce((acc, group) => acc + group.length, 0) +
                    individualPreview.length ||
                groupPreview.some((group) => group.length === 1) ||
                (groupPreview.length === 0 && individualPreview.length === 0) ||
                isImporting
              }
              className="bg-green-600 hover:bg-green-700 text-white w-full py-2"
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
      </div>
    </div>
  );
}
