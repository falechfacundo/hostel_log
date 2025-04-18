import { useTravelerStore } from "@/store/travelerStore";

import { BackpackToggle } from "@/components/ui/backpack-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Users, UserPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function GroupsList({
  isLoading = false,
  // Other props are maintained for backward compatibility
  groups,
  onDeleteGroup,
  onAddMember,
  onUpdatePerson,
}) {
  // Get functions and state directly from the store
  const totalPersons = useTravelerStore((state) => state.totalPersons);
  const maxPersons = useTravelerStore((state) => state.maxPersons);
  const updatePerson = useTravelerStore((state) => state.updatePerson);
  const deleteGroup = useTravelerStore((state) => state.deleteGroup);
  const addPersonToGroup = useTravelerStore((state) => state.addPersonToGroup);
  const removePersonFromGroup = useTravelerStore(
    (state) => state.removePersonFromGroup
  );
  const storeGroups = useTravelerStore((state) => state.groups);
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);
  const storeIndividuals = useTravelerStore((state) => state.individuals);

  // Estado para seguir qué elementos están siendo eliminados
  const [deletingMembers, setDeletingMembers] = useState({});

  // Use store functions if no props were provided (for backward compatibility)
  const effectiveGroups = groups || storeGroups;
  const effectiveDeleteGroup = onDeleteGroup || deleteGroup;
  const effectiveAddMember =
    onAddMember ||
    ((groupId, personData) => {
      const group = storeGroups.find((g) => g.id === groupId);
      if (group) {
        addPersonToGroup({
          groupId,
          personData: {
            ...personData,
            partnerId: selectedPartner?.id,
          },
        });
      }
    });
  const effectiveUpdatePerson =
    onUpdatePerson ||
    ((personData) => {
      console.log("Updating person:", personData);
      // Ensure we're passing the complete person data
      return updatePerson({
        id: personData.id,
        backpack: personData.backpack,
        // Include other fields if needed to prevent overwriting
        ...(personData.name && { name: personData.name }),
      });
    });

  // Manejador de eliminación con confirmación
  const handleDeleteGroup = (groupId) => {
    // Añadir confirmación para prevenir eliminaciones accidentales
    if (confirm(`¿Estás seguro de eliminar el grupo?`)) {
      console.log("Eliminando grupo con ID:", groupId);
      effectiveDeleteGroup(groupId);
    }
  };

  // Manejador mejorado para eliminar miembros
  const handleRemoveMember = (groupId, personId, personName) => {
    // Update state to show loading indicator
    setDeletingMembers((prev) => ({ ...prev, [personId]: true }));

    // Confirm deletion
    try {
      removePersonFromGroup({ groupId, personId });
      // El estado se limpiará cuando el componente se actualice debido a
      // la actualización optimista, pero por si acaso:
      setTimeout(() => {
        setDeletingMembers((prev) => {
          const updated = { ...prev };
          delete updated[personId];
          return updated;
        });
      }, 300);
    } catch (error) {
      console.error("Error removing member:", error);
      // Clean up deletion state
      setDeletingMembers((prev) => {
        const updated = { ...prev };
        delete updated[personId];
        return updated;
      });
    }
  };

  // Function to add member to group with complete data
  const handleAddMember = (groupId, personData) => {
    effectiveAddMember(groupId, personData);
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando grupos...</div>;
  }

  if (effectiveGroups.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No hay grupos</h3>
        <p className="mt-1 text-muted-foreground">
          Crea un grupo usando el formulario
        </p>
      </div>
    );
  }

  return (
    <div className="md:col-span-2">
      <h2 className="text-2xl font-bold mb-4">Grupos</h2>
      <div className="space-y-4 grid gap-4 grid-cols-2">
        {effectiveGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-muted-foreground">
                    {group.people?.length || 0} personas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              {/* Formulario para agregar miembros siempre visible */}
              <form
                className="mb-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.name;
                  handleAddMember(group.id, { name: input.value }); // Usamos la función local
                  input.value = "";
                }}
              >
                <Input
                  name="name"
                  type="text"
                  placeholder="Nombre del miembro..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled={totalPersons == maxPersons}
                  required
                />
                <Button
                  type="submit"
                  className="px-3 py-2 bg-blue-500 text-white rounded-md"
                  disabled={totalPersons == maxPersons}
                >
                  Agregar
                </Button>
              </form>

              {/* Lista de miembros con toggle de mochila */}
              <div className="space-y-2">
                {group.people?.length ? (
                  <div className="divide-y">
                    {group.people.map((person) => (
                      <div
                        key={person.id}
                        className={cn(
                          "flex justify-between items-center py-3",
                          deletingMembers[person.id] && "opacity-50"
                        )}
                      >
                        <span>{person.name || "Sin nombre"}</span>

                        <div className="flex items-center gap-2">
                          {/* Componente toggle de mochila */}
                          <BackpackToggle
                            person={person}
                            onUpdate={(updatedData) => {
                              effectiveUpdatePerson(updatedData);
                              // Force UI refresh if needed
                              setDeletingMembers({ ...deletingMembers });
                            }}
                            disabled={deletingMembers[person.id]}
                          />

                          <button
                            onClick={() =>
                              handleRemoveMember(
                                group.id,
                                person.id,
                                person.name
                              )
                            }
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            disabled={deletingMembers[person.id]}
                          >
                            {deletingMembers[person.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-2">
                    No hay miembros en este grupo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
