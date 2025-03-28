import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "./draggable";

export function IndividualsPanel({ individuals, assignedStatus = {} }) {
  // Add function to check if individual is assigned
  const isIndividualAssigned = (individual) => {
    return assignedStatus[individual.id] || false;
  };

  // Filter out assigned individuals AND individuals that belong to a group
  const availableIndividuals = individuals.filter(
    (individual) =>
      !isIndividualAssigned(individual) &&
      (!individual.group_id || individual.group_id === null)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Personas Disponibles
          <span className="ml-auto text-xs text-muted-foreground">
            {availableIndividuals.length} disponibles
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[26vh] overflow-y-scroll space-y-2">
        {availableIndividuals.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No hay personas disponibles
          </div>
        ) : (
          availableIndividuals.map((individual) => (
            <Draggable
              key={`individual-${individual.id}`}
              id={`individual-${individual.id}`}
            >
              <div
                className={cn(
                  "p-3 rounded-lg border border-border transition-colors",
                  "bg-card hover:bg-accent cursor-move"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{individual.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {individual.notes || ""}
                    </p>
                  </div>
                </div>
              </div>
            </Draggable>
          ))
        )}
      </CardContent>
    </Card>
  );
}
