import { formatDate } from "@/lib/utils";
import React from "react";

// Componente para renderizar el contenido que será convertido a imagen
export function HostelPrintView({
  hostel,
  room,
  assignments,
  date,
  entities,
  id,
}) {
  // Usar ID proporcionado o generar uno basado en el ID de la habitación
  const elementId = id || `print-${room.id}`;

  // Filtrar las asignaciones para este cuarto específico
  const roomAssignments = assignments.filter(
    (assignment) => assignment.roomId === room.id
  );

  // Helper para obtener la entidad completa con datos actualizados
  const getCompleteEntity = (assignment) => {
    // Si la asignación ya tiene una entidad completa, usarla
    if (
      assignment.entity &&
      ((assignment.type === "group" && assignment.entity.people?.length > 0) ||
        assignment.type === "individual")
    ) {
      return assignment.entity;
    }

    // Si no, buscar en las entidades originales
    if (assignment.type === "group" && assignment.groupId) {
      return (
        entities?.groups?.find((g) => g.id === assignment.groupId) ||
        assignment.entity
      );
    } else if (assignment.type === "individual" && assignment.individualId) {
      return (
        entities?.individuals?.find((i) => i.id === assignment.individualId) ||
        assignment.entity
      );
    }

    // Si no se encuentra, devolver la entidad original
    return assignment.entity;
  };

  // Obtener la capacidad y ocupación
  const capacity = room.capacity || 0;
  const occupied = roomAssignments.reduce((total, assignment) => {
    const entity = getCompleteEntity(assignment);

    if (assignment.type === "group" && entity?.people?.length) {
      return total + entity.people.length;
    } else {
      return total + 1;
    }
  }, 0);

  return (
    <div
      className="print-container bg-white p-6 rounded-lg border"
      id={elementId}
      style={{ minWidth: "500px" }}
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">{hostel.name}</h2>
        <h3 className="text-lg font-semibold">{room.name}</h3>
        <p className="text-sm text-gray-600">{formatDate(date)}</p>
      </div>

      <div className="border-b pb-2 mb-2">
        <p className="text-sm">
          <span className="font-medium">Ocupación:</span> {occupied} /{" "}
          {capacity} personas
        </p>
      </div>

      {roomAssignments.length === 0 ? (
        <p className="text-center text-gray-500 p-4">
          Esta habitación está vacía
        </p>
      ) : (
        <div className="space-y-4">
          {roomAssignments.map((assignment) => {
            const entity = getCompleteEntity(assignment);

            return (
              <div key={assignment.id} className="border p-3 rounded">
                <p className="font-bold border-b pb-1">
                  {entity?.name || "Sin nombre"}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({assignment.type === "group" ? "Grupo" : "Individual"})
                  </span>
                </p>

                {assignment.type === "group" && entity?.people?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">
                      Integrantes ({entity.people.length}):
                    </p>
                    <ul className="list-disc pl-5 text-sm">
                      {entity.people.map((person, idx) => (
                        <li
                          key={person.id || idx}
                          className="flex items-center justify-between"
                        >
                          <div>
                            {person.name || person.first_name || "Sin nombre"}
                            {person.identification && (
                              <span className="text-gray-600">
                                {" "}
                                ({person.identification})
                              </span>
                            )}
                          </div>

                          {person.backpack && (
                            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                              Mochila
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-2 border-t text-center text-xs text-gray-400">
        Generado por Shelter Log - {new Date().toLocaleString()}
      </div>
    </div>
  );
}
