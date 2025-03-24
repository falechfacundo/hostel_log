import { useTravelerStore } from "@/store/travelerStore";

import { BackpackToggle } from "@/components/ui/backpack-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User, Calendar } from "lucide-react";

import { format } from "date-fns";
import { es } from "date-fns/locale";

export function IndividualsList({
  individuals = [],
  isLoading = false,
  onRemoveIndividual,
}) {
  // Get the updatePerson function directly from the store
  const updatePerson = useTravelerStore((state) => state.updatePerson);

  // Función para formatear fechas en formato español
  const formatDateOrDefault = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch (e) {
      return "-";
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando personas...</div>;
  }

  if (individuals.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">
          No hay personas individuales
        </h3>
        <p className="mt-1 text-muted-foreground">
          Agrega personas individuales usando el formulario
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Personas Individuales</h2>
      <div className="space-y-2">
        {individuals.map((person) => (
          <Card key={person.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {person.name || person.first_name || "Sin nombre"}
                  </h3>
                  {person.notes && (
                    <p className="text-sm text-muted-foreground">
                      {person.notes}
                    </p>
                  )}

                  {/* Fechas de estadía si existen */}
                  {(person.start_date || person.end_date) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {formatDateOrDefault(person.start_date)} -{" "}
                        {formatDateOrDefault(person.end_date)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <BackpackToggle person={person} onUpdate={updatePerson} />

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemoveIndividual(person.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
