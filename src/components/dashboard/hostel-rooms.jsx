import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { Droppable } from "./droppable";
import { Tooltip } from "@/components/ui/tooltip";

export function HostelRooms({
  hostel,
  assignments,
  removeAssignment,
  entities,
  date,
}) {
  // Función para obtener el número correcto de personas en un grupo
  const getEntityPeopleCount = (assignment) => {
    if (assignment.type !== "group" || !assignment.entity) return 1;

    // Si la entidad tiene un campo people como array, usar su longitud
    if (Array.isArray(assignment.entity.people)) {
      return assignment.entity.people.length;
    }

    // Si la entidad tiene un campo size, usarlo
    if (typeof assignment.entity.size === "number") {
      return assignment.entity.size;
    }

    // Si la entidad es optimista, buscar en los datos originales
    if (assignment.isOptimistic && assignment.groupId) {
      const originalGroup = entities.groups?.find(
        (g) => g.id === assignment.groupId
      );
      if (originalGroup) {
        if (Array.isArray(originalGroup.people)) {
          return originalGroup.people.length;
        }
        if (typeof originalGroup.size === "number") {
          return originalGroup.size;
        }
      }
    }

    // Valor por defecto si no se puede determinar
    return 0;
  };

  // Función para calcular la ocupación de una habitación
  const getRoomOccupancy = (room) => {
    // Filtrar las asignaciones para esta habitación
    const roomAssignments = assignments.filter((a) => a.roomId === room.id);

    // Calcular ocupación considerando el tamaño de los grupos
    const currentPeopleCount = roomAssignments.reduce((total, assignment) => {
      // Usar la función auxiliar para obtener el número correcto de personas
      return total + getEntityPeopleCount(assignment);
    }, 0);

    return {
      current: currentPeopleCount,
      total: room.capacity || 0,
      remaining: (room.capacity || 0) - currentPeopleCount,
      assignmentsForRoom: roomAssignments,
    };
  };

  // Mensaje si no hay habitaciones
  if (!hostel.rooms || hostel.rooms.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Este albergue no tiene habitaciones
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {hostel.rooms.map((room) => {
        const { current, total, remaining, assignmentsForRoom } =
          getRoomOccupancy(room);

        const isFull = remaining <= 0;

        return (
          <Droppable key={room.id} id={room.id} disabled={isFull}>
            <div
              className={cn(
                "p-4 rounded-lg border-2 min-h-[120px] transition-colors",
                isFull && "bg-gray-100 border-gray-300",
                assignmentsForRoom.length > 0 &&
                  !isFull &&
                  "border-primary bg-secondary/20",
                !assignmentsForRoom.length &&
                  "border-border hover:border-primary/50"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  <p
                    className={cn(
                      "text-xs",
                      isFull
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {current}/{total} personas
                    {isFull && " (Lleno)"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {assignmentsForRoom.map((assignment) => {
                  // Obtener el conteo correcto de personas para este grupo
                  const peopleCount = getEntityPeopleCount(assignment);

                  return (
                    <div key={assignment.id}>
                      <div
                        className={cn(
                          "flex justify-between items-center",
                          assignment.isOptimistic &&
                            "border border-dashed border-primary"
                        )}
                      >
                        <div className="overflow-hidden">
                          <p className="font-medium flex items-center">
                            <span className="truncate">
                              {assignment.entity?.name}
                            </span>
                            <span
                              className={cn(
                                "ml-2 text-xs italic min-w-16 inline-block transition-opacity duration-300",
                                assignment.isOptimistic
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                              )}
                            >
                              (asignando...)
                            </span>
                          </p>

                          {assignment.type === "group" &&
                            (() => {
                              const matchedGroup = entities.groups?.find(
                                (group) => group.id === assignment.groupId
                              );

                              if (
                                matchedGroup &&
                                Array.isArray(matchedGroup.people) &&
                                matchedGroup.people.length > 0
                              ) {
                                return (
                                  <div className="text-xs flex flex-col gap-1">
                                    {matchedGroup.people.map(
                                      (person, index) => (
                                        <span
                                          key={
                                            typeof person === "object"
                                              ? person.id || index
                                              : index
                                          }
                                        >
                                          {typeof person === "object"
                                            ? person.name
                                            : person}
                                        </span>
                                      )
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}

                          <p className="text-sm text-muted-foreground truncate">
                            {assignment.type === "group"
                              ? `${peopleCount} personas`
                              : "Individual"}
                          </p>
                        </div>

                        {/* Contenedor de botón con dimensiones fijas siempre */}
                        <div className="w-8 h-8 flex items-center justify-center">
                          {assignment.isOptimistic ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0" // Dimensiones consistentes
                              onClick={() => removeAssignment(assignment.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isFull && remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Espacio disponible: {remaining} personas
                </p>
              )}
            </div>
          </Droppable>
        );
      })}
    </div>
  );
}
