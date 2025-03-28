import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Backpack } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "./draggable";

export function GroupsPanel({ groups, assignedStatus = {} }) {
  // Función para generar el contenido del tooltip con los nombres de las personas
  const renderPeopleTooltip = (group) => {
    if (!group.people || group.people.length === 0) {
      return (
        <div className="text-xs italic">No hay personas en este grupo</div>
      );
    }

    return (
      <div className="p-1 max-h-[200px] overflow-y-auto">
        <div className="font-medium mb-1 text-primary">Miembros del grupo:</div>
        <ul className="list-disc list-inside space-y-1">
          {group.people.map((person, index) => (
            <li key={person.id || index} className="text-xs flex items-center">
              <span className="truncate">
                {person.name || person.first_name || "Sin nombre"}
              </span>
              {person.backpack && (
                <Backpack className="ml-1 h-3 w-3 text-primary" />
              )}
            </li>
          ))}
        </ul>
        <div className="text-xs text-muted-foreground mt-1">
          Total: {group.people.length} personas
        </div>
      </div>
    );
  };

  // Add function to check if group is assigned
  const isGroupAssigned = (group) => {
    return assignedStatus[group.id] || false;
  };

  // Filter out assigned groups
  const availableGroups = groups.filter((group) => !isGroupAssigned(group));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Grupos Disponibles
          <span className="ml-auto text-xs text-muted-foreground">
            {availableGroups.length} disponibles
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[44vh] overflow-y-scroll space-y-2">
        {availableGroups.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No hay grupos disponibles
          </div>
        ) : (
          availableGroups.map((group) => (
            <Draggable key={`group-${group.id}`} id={`group-${group.id}`}>
              <div
                className={cn(
                  "p-3 rounded-lg border border-border transition-colors relative",
                  "bg-card hover:bg-accent cursor-move"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <p>{group.people.length} personas</p>
                    <ul>
                      {group.people?.map((person) => (
                        <li
                          key={person.id}
                          className="text-sm text-muted-foreground"
                        >
                          {person.name}
                        </li>
                      ))}
                    </ul>
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
