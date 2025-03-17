import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "./draggable";

export function IndividualsPanel({ individuals, assignedStatus = {} }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Personas Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {individuals.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No hay personas disponibles
          </div>
        ) : (
          individuals.map((individual) => {
            const isAssigned = assignedStatus[individual.id] || false;

            return (
              <Draggable
                key={`individual-${individual.id}`}
                id={`individual-${individual.id}`}
                disabled={isAssigned}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg border border-border transition-colors",
                    isAssigned
                      ? "bg-gray-100 opacity-50 cursor-not-allowed"
                      : "bg-card hover:bg-accent cursor-move"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{individual.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {individual.notes || ""}
                      </p>
                    </div>
                    {isAssigned && (
                      <span className="text-xs text-muted-foreground">
                        Asignado
                      </span>
                    )}
                  </div>
                </div>
              </Draggable>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
