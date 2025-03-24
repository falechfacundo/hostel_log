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
import { Upload, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Replace useTravelers with useTravelerStore
import { useTravelerStore } from "@/store/travelerStore";
import { usePartnerStore } from "@/store/partnerStore";

export function BulkGroupImport() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Get the createGroup function directly from the store
  const createGroup = useTravelerStore((state) => state.createGroup);
  // Get the selected partner from the partner store
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);

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

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    // Actualizar vista previa
    setPreview(parseGroups(newText));
  };

  const processGroups = async () => {
    const parsedGroups = parseGroups(text);

    if (parsedGroups.length === 0) {
      toast.error("No hay grupos para importar");
      return;
    }

    setIsImporting(true);

    try {
      // Create groups one by one
      let importedCount = 0;

      // Process groups sequentially
      for (const members of parsedGroups) {
        const groupData = {
          notes: `${members.length} personas`,
          people: members.map((name) => ({
            name: name.trim(),
          })),
          partnerId: selectedPartner.id,
        };

        // Use the createGroup function directly from the store
        await createGroup(groupData);
        importedCount++;
      }

      setText("");
      setPreview([]);
      setIsOpen(false);
      toast.success(`Importados ${importedCount} grupos con éxito`);
    } catch (error) {
      toast.error(`Error al importar grupos: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-fuchsia-pink-500 hover:bg-fuchsia-pink-600 gap-2">
          <Upload className="h-4 w-4" />
          Importar desde Texto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Grupos desde Texto</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {/* Panel de entrada */}
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Instrucciones:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Una persona por línea</li>
                <li>Línea en blanco para separar grupos</li>
              </ul>
            </div>
            <Textarea
              placeholder="SONIA SERRAS&#10;ESTER FERNANDEZ&#10;JESUS RODRIGUEZ&#10;&#10;MARIA BOIX GUILABERT&#10;TANIA MATO SANCHEZ"
              value={text}
              onChange={handleTextChange}
              className="h-[400px] font-mono"
            />
          </div>

          {/* Panel de vista previa */}
          <div className="border-l pl-4">
            <h3 className="font-medium mb-4">Vista Previa:</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {preview.map((group, groupIndex) => (
                <div key={groupIndex} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Grupo {groupIndex + 1}</span>
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
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={processGroups}
            disabled={!preview.length || isImporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Importar {preview.length}{" "}
            {preview.length === 1 ? "Grupo" : "Grupos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
