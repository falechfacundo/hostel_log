import { useTravelers } from "@/hooks/useTravelers";
import { BackpackToggle } from "@/components/ui/backpack-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, UserPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function GroupsList({
  isLoading = false,
  // We no longer need onRemoveMember prop as we'll use the hook
}) {
  const {
    updatePerson,
    deleteGroup,
    addPersonToGroup,
    groups,
    removePersonFromGroup,
    selectedPartner,
    individuals, // Add individuals to the destructured values from the hook
  } = useTravelers();

  // Estado para seguir qué elementos están siendo eliminados
  const [deletingMembers, setDeletingMembers] = useState({});

  // Manejador de eliminación con confirmación
  const handleDeleteGroup = (groupId) => {
    // Añadir confirmación para prevenir eliminaciones accidentales
    if (confirm(`¿Estás seguro de eliminar el grupo?`)) {
      console.log("Eliminando grupo con ID:", groupId);
      deleteGroup(groupId); // Usamos deleteGroup directamente del hook
    }
  };

  // Manejador mejorado que usa removePersonFromGroup del hook
  const handleRemoveMember = (groupId, personId, personName) => {
    // Actualizar estado para mostrar indicador de carga
    setDeletingMembers((prev) => ({ ...prev, [personId]: true }));

    // Confirmar eliminación
    if (
      confirm(`¿Quieres eliminar a ${personName || "este miembro"} del grupo?`)
    ) {
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
        // Limpiar estado de eliminación
        setDeletingMembers((prev) => {
          const updated = { ...prev };
          delete updated[personId];
          return updated;
        });
      }
    } else {
      // Cancelado, limpiar estado
      setDeletingMembers((prev) => {
        const updated = { ...prev };
        delete updated[personId];
        return updated;
      });
    }
  };

  // Función para manejar el evento de añadir miembro al grupo
  // Function to add member to group with complete data including partner_id
  const handleAddMember = (group, personData) => {
    const partnerId = group.partner_id;

    // Count all people across all groups belonging to this partner
    const totalPeopleInGroups = groups
      .filter((g) => g.partner_id === partnerId)
      .reduce((total, g) => total + (g.people?.length || 0), 0);

    // Count all individuals belonging to this partner
    const totalIndividuals = individuals
      ? individuals.filter((i) => i.partner_id === partnerId).length
      : 0;

    // Total people count (groups + individuals)
    const totalPeopleWithPartner = totalPeopleInGroups + totalIndividuals;

    const partnerSizeLimit = selectedPartner?.size || 0;

    // Check if adding another person would exceed the partner's total capacity
    if (totalPeopleWithPartner >= partnerSizeLimit) {
      alert(
        `No se pueden agregar más personas. El socio ya tiene ${totalPeopleWithPartner} personas asignadas de un límite de ${partnerSizeLimit}.`
      );
      return;
    }

    const completePersonData = {
      ...personData,
      partner_id: partnerId,
    };

    addPersonToGroup({ group, personData: completePersonData });
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando grupos...</div>;
  }

  if (groups.length === 0) {
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
        {groups.map((group) => (
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
                  handleAddMember(group, { name: input.value }); // Usamos la función local
                  input.value = "";
                }}
              >
                <input
                  name="name"
                  type="text"
                  placeholder="Nombre del miembro..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-500 text-white rounded-md"
                >
                  Agregar
                </button>
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
                            onUpdate={updatePerson}
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
