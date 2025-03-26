import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { useDateStore } from "@/store/date-store";
import { persist } from "zustand/middleware";

// Import server actions
import {
  fetchPartnersByDate as fetchPartnersByDateAction,
  createPartner as createPartnerAction,
  deletePartner as deletePartnerAction,
} from "@/actions/partner-actions";

export const useTravelerStore = create(
  persist(
    (set, get) => {
      return {
        // Core state
        partners: [],
        groups: [],
        individuals: [],
        totalPersons: 0,
        maxPersons: 999,
        isLoading: false,
        error: null,
        lastRequestDate: null, // Track the last date requested

        // From partnerStore
        selectedPartner: null,
        hostelAssignments: [],

        // Partner selection actions
        setSelectedPartner: (partner) => {
          if (!partner) {
            set({
              selectedPartner: null,
              groups: [],
              individuals: [],
              totalPersons: 0,
              maxPersons: 999,
            });
            return;
          }

          let persons = 0;

          if (partner?.groups) {
            partner.groups.forEach((group) => {
              if (group.people) {
                persons += group.people.length;
              }
            });
          }

          // Add individual persons
          if (partner?.individuals) {
            persons += partner.individuals.length;
          }

          set({
            selectedPartner: partner,
            groups: partner.groups || [],
            individuals: partner.individuals || [],
            maxPersons: partner.size || 999,
            totalPersons: persons,
          });

          // Trigger partner change event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("partner-changed", {
                detail: { partner },
              })
            );
          }
        },

        // Direct setters
        setGroups: (groups) => set({ groups }),
        setIndividuals: (individuals) => set({ individuals }),
        setHostelAssignments: (assignments) =>
          set({ hostelAssignments: assignments }),

        // Reset store data function
        clearStoreData: () => {
          set({
            selectedPartner: null,
            groups: [],
            individuals: [],
            hostelAssignments: [],
            totalPersons: 0,
            maxPersons: 999,
          });

          // Trigger partner-cleared event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("partner-cleared", {
                detail: { cleared: true },
              })
            );
          }
        },

        // Data fetching
        fetchPartnersByDate: async (date, forceRefresh = false) => {
          try {
            set({
              isLoading: true,
              error: null,
              lastRequestDate: date, // Store the date for potential retries
            });

            const dateStr = format(new Date(date), "yyyy-MM-dd");

            console.log("ZUSTAND: Fetching partners by date via Server Action");

            // Clear partner store if forced refresh is requested
            if (forceRefresh) {
              get().clearStoreData();
            }

            // Use the server action directly
            const result = await fetchPartnersByDateAction(dateStr);

            // Handle error responses from server action
            if (result.error) {
              throw new Error(result.error);
            }

            const { partners, groups, individuals } = result;

            console.log("ZUSTAND: Partners fetched:", partners);
            console.log("ZUSTAND: Groups fetched:", groups);
            console.log("ZUSTAND: Individuals fetched:", individuals);

            if (!partners?.length) {
              set({
                partners: [],
                groups: [],
                individuals: [],
                isLoading: false,
              });
              return [];
            }

            // Update state with data from server action
            set({
              partners,
              groups: groups || [],
              individuals: individuals || [],
              isLoading: false,
            });

            // Update selected partner if needed
            const selectedPartner = get().selectedPartner;

            if (selectedPartner?.id) {
              const currentPartner = partners.find(
                (p) => p.id === selectedPartner.id
              );
              if (currentPartner) {
                get().setSelectedPartner(currentPartner);

                // If this is the currently selected partner, make sure to update individuals correctly
                if (currentPartner.id === selectedPartner.id) {
                  // Fetch proper individuals for this partner
                  const partnerIndividuals = individuals.filter(
                    (ind) => ind.partner_id === currentPartner.id
                  );
                  set({ individuals: partnerIndividuals });
                }
              }
            }

            return partners;
          } catch (error) {
            console.error("Error fetching partners:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al cargar partners: ${error.message}`);
            throw error;
          }
        },

        // Methods to cancel ongoing requests
        cancelRequests: () => {
          set({ isLoading: false });
        },

        // Data fetchers
        fetchGroups: async (partnerId) => {
          if (!partnerId) {
            console.log(
              "No partner ID provided for fetching groups, returning empty array"
            );
            return [];
          }

          // Extraer ID si partnerId es un objeto
          const actualPartnerId =
            typeof partnerId === "object" && partnerId !== null
              ? partnerId.id || null
              : partnerId;

          // Solo continuar con la consulta si tenemos un ID de partner válido
          if (!actualPartnerId) {
            console.log("Invalid partner ID, returning empty array");
            return [];
          }

          try {
            let query = supabase
              .from("groups")
              .select(
                `
                *,
                person(*)
              `
              )
              .eq("partner_id", actualPartnerId);

            const { data, error } = await query;

            if (error)
              throw new Error(`Error fetching groups: ${error.message}`);

            // Formatear datos para que coincidan con la estructura original
            return data.map((group) => ({
              ...group,
              people: group.person || [],
            }));
          } catch (error) {
            console.error("Error in fetchGroups:", error);
            return [];
          }
        },

        fetchIndividuals: async (partnerId) => {
          if (!partnerId) {
            console.log(
              "No partner ID provided for fetching individuals, returning empty array"
            );
            return [];
          }

          // Extraer ID si partnerId es un objeto
          const actualPartnerId =
            typeof partnerId === "object" && partnerId !== null
              ? partnerId.id || null
              : partnerId;

          // Solo continuar con la consulta si tenemos un ID de partner válido
          if (!actualPartnerId) {
            console.log("Invalid partner ID, returning empty array");
            return [];
          }

          try {
            let query = supabase
              .from("person")
              .select("*")
              .is("group_id", null)
              .eq("partner_id", actualPartnerId)
              .order("name");

            const { data, error } = await query;

            if (error)
              throw new Error(`Error fetching individuals: ${error.message}`);

            return data || [];
          } catch (error) {
            console.error("Error in fetchIndividuals:", error);
            return [];
          }
        },

        fetchHostelAssignments: async (partnerId) => {
          if (!partnerId) {
            console.log(
              "No partner ID provided for fetching hostel assignments, returning empty array"
            );
            return [];
          }

          // Extraer ID si partnerId es un objeto
          const actualPartnerId =
            typeof partnerId === "object" && partnerId !== null
              ? partnerId.id || null
              : partnerId;

          // Solo continuar con la consulta si tenemos un ID de partner válido
          if (!actualPartnerId) {
            console.log(
              "Invalid partner ID for hostel assignments, returning empty array"
            );
            return [];
          }

          try {
            const { data, error } = await supabase
              .from("hostel_partner_assignments")
              .select(
                `
                *,
                hostel:hostels(*)
              `
              )
              .eq("partner_id", actualPartnerId);

            if (error)
              throw new Error(
                `Error fetching hostel assignments: ${error.message}`
              );

            return data || [];
          } catch (error) {
            console.error("Error in fetchHostelAssignments:", error);
            return [];
          }
        },

        // Core mutations
        createGroup: async (groupData) => {
          try {
            set({ isLoading: true, error: null });

            const { partnerId } = groupData;
            const newTotalPersons =
              get().totalPersons + (groupData.people?.length || 0);

            if (newTotalPersons > get().maxPersons) {
              throw new Error("El grupo excede el límite de personas");
            }

            // Crear el grupo
            const { data: newGroup, error: groupError } = await supabase
              .from("groups")
              .insert([
                {
                  size: groupData.people?.length,
                  partner_id: partnerId,
                },
              ])
              .select()
              .single();

            if (groupError)
              throw new Error(`Error creating group: ${groupError.message}`);

            // Si hay personas, crearlas
            let people = [];
            if (groupData.people && groupData.people.length > 0) {
              const peopleToInsert = groupData.people.map((person) => ({
                name: person.name,
                backpack: person.backpack || false,
                group_id: newGroup.id,
                partner_id: partnerId,
              }));

              const { data: newPeople, error: peopleError } = await supabase
                .from("person")
                .insert(peopleToInsert)
                .select();

              if (peopleError)
                throw new Error(
                  `Error creating people: ${peopleError.message}`
                );

              people = newPeople || [];
            }

            // Combinar grupo y personas
            const fullGroup = {
              ...newGroup,
              people,
            };

            // Actualizar estado: añadir grupo a los grupos actuales
            set((state) => {
              // Actualizar los grupos
              const newGroups = [...state.groups, fullGroup];

              // También actualizamos el partner correspondiente
              const updatedPartners = state.partners.map((partner) => {
                if (partner.id === partnerId) {
                  return {
                    ...partner,
                    groups: [...(partner.groups || []), fullGroup],
                  };
                }
                return partner;
              });

              return {
                groups: newGroups,
                partners: updatedPartners,
                totalPersons: newTotalPersons,
                isLoading: false,
              };
            });

            // Actualizar grupos en el estado si corresponde al partner seleccionado
            if (get().selectedPartner?.id === partnerId) {
              // Filtramos los grupos para incluir solo los del partner seleccionado
              const partnerGroups = get().groups.filter(
                (g) => g.partner_id === partnerId
              );
              set({ groups: partnerGroups });
            }

            return fullGroup;
          } catch (error) {
            console.error("Error in createGroup:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al crear grupo: ${error.message}`);
            throw error;
          }
        },

        deleteGroup: async (id) => {
          try {
            set({ isLoading: true, error: null });

            // Obtener los datos del grupo antes de eliminar
            const groupToDelete = get().groups.find((g) => g.id === id);
            if (!groupToDelete) {
              throw new Error("Group not found");
            }

            const { error } = await supabase
              .from("groups")
              .delete()
              .eq("id", id);

            if (error)
              throw new Error(`Error deleting group: ${error.message}`);

            // Actualizar estado
            set((state) => {
              // Filtrar el grupo eliminado
              const filteredGroups = state.groups.filter((g) => g.id !== id);

              // También actualizar el partner correspondiente
              const updatedPartners = state.partners.map((partner) => {
                if (partner.id === groupToDelete.partner_id) {
                  return {
                    ...partner,
                    groups: (partner.groups || []).filter((g) => g.id !== id),
                  };
                }
                return partner;
              });

              const newTotalPersons =
                state.totalPersons - (groupToDelete.size || 0);

              return {
                groups: filteredGroups,
                partners: updatedPartners,
                totalPersons: newTotalPersons,
                isLoading: false,
              };
            });

            // Actualizar grupos si corresponde al partner seleccionado
            if (get().selectedPartner?.id === groupToDelete.partner_id) {
              // Filtramos los grupos para incluir solo los del partner seleccionado
              const partnerId = get().selectedPartner.id;
              const partnerGroups = get().groups.filter(
                (g) => g.partner_id === partnerId && g.id !== id
              );
              set({ groups: partnerGroups });
            }

            return groupToDelete;
          } catch (error) {
            console.error("Error in deleteGroup:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al eliminar grupo: ${error.message}`);
            throw error;
          }
        },

        createIndividual: async (individualData) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase
              .from("person")
              .insert([
                {
                  name: individualData.name,
                  backpack: individualData.backpack || false,
                  partner_id: individualData.partnerId,
                },
              ])
              .select()
              .single();

            if (error)
              throw new Error(`Error creating individual: ${error.message}`);

            // Actualizar estado
            set((state) => {
              // Añadir individuo a la lista
              const newIndividuals = [...state.individuals, data];

              // También actualizar el partner correspondiente
              const updatedPartners = state.partners.map((partner) => {
                if (partner.id === individualData.partnerId) {
                  return {
                    ...partner,
                    individuals: [...(partner.individuals || []), data],
                  };
                }
                return partner;
              });

              const newTotalPersons = state.totalPersons + 1;

              return {
                individuals: newIndividuals,
                partners: updatedPartners,
                totalPersons: newTotalPersons,
                isLoading: false,
              };
            });

            // Actualizar individuales si corresponde al partner seleccionado
            if (get().selectedPartner?.id === individualData.partnerId) {
              set({ individuals: [...get().individuals] });
            }

            return data;
          } catch (error) {
            console.error("Error in createIndividual:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al crear persona: ${error.message}`);
            throw error;
          }
        },

        deleteIndividual: async (id) => {
          try {
            set({ isLoading: true, error: null });

            // Obtener los datos del individuo antes de eliminar
            const individualToDelete = get().individuals.find(
              (i) => i.id === id
            );
            if (!individualToDelete) {
              throw new Error("Individual not found");
            }

            const { error } = await supabase
              .from("person")
              .delete()
              .eq("id", id);

            if (error)
              throw new Error(`Error deleting individual: ${error.message}`);

            // Actualizar estado
            set((state) => {
              // Filtrar el individuo eliminado
              const filteredIndividuals = state.individuals.filter(
                (i) => i.id !== id
              );

              // También actualizar el partner correspondiente
              const updatedPartners = state.partners.map((partner) => {
                if (partner.id === individualToDelete.partner_id) {
                  return {
                    ...partner,
                    individuals: (partner.individuals || []).filter(
                      (i) => i.id !== id
                    ),
                  };
                }
                return partner;
              });

              const newTotalPersons = state.totalPersons - 1;

              return {
                individuals: filteredIndividuals,
                partners: updatedPartners,
                totalPersons: newTotalPersons,
                isLoading: false,
              };
            });

            // Actualizar PartnerStore
            if (get().selectedPartner?.id === individualToDelete.partner_id) {
              set({
                individuals: get().individuals.filter((i) => i.id !== id),
              });
            }

            return { id };
          } catch (error) {
            console.error("Error in deleteIndividual:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al eliminar persona: ${error.message}`);
            throw error;
          }
        },

        addPersonToGroup: async ({ groupId, personData }) => {
          try {
            set({ isLoading: true, error: null });

            // Encontrar el grupo
            const group = get().groups.find((g) => g.id === groupId);
            if (!group) {
              throw new Error("Group not found");
            }

            // Asegurarse de que tenemos el partner_id correcto
            const partnerId = personData.partnerId || group.partner_id;

            // Crear la persona
            const { data: newPerson, error } = await supabase
              .from("person")
              .insert([
                {
                  name: personData.name,
                  backpack: personData.backpack || false,
                  group_id: groupId,
                  partner_id: partnerId,
                },
              ])
              .select()
              .single();

            if (error)
              throw new Error(`Error adding person to group: ${error.message}`);

            // Calcular el nuevo tamaño
            const newSize = (group.size || 0) + 1;

            // Actualizar el tamaño del grupo
            await supabase
              .from("groups")
              .update({ size: newSize })
              .eq("id", groupId);

            // Actualizar estado
            set((state) => {
              // Actualizar el grupo con la nueva persona y tamaño
              const updatedGroups = state.groups.map((g) => {
                if (g.id === groupId) {
                  return {
                    ...g,
                    size: newSize,
                    people: [...(g.people || []), newPerson],
                  };
                }
                return g;
              });

              // También actualizar el partner correspondiente
              const updatedPartners = state.partners.map((partner) => {
                if (partner.id === partnerId) {
                  return {
                    ...partner,
                    groups: (partner.groups || []).map((g) => {
                      if (g.id === groupId) {
                        return {
                          ...g,
                          size: newSize,
                          people: [...(g.people || []), newPerson],
                        };
                      }
                      return g;
                    }),
                  };
                }
                return partner;
              });

              const newTotalPersons = state.totalPersons + 1;

              return {
                groups: updatedGroups,
                partners: updatedPartners,
                totalPersons: newTotalPersons,
                isLoading: false,
              };
            });

            // Actualizar PartnerStore
            if (get().selectedPartner?.id === partnerId) {
              // Filtramos los grupos para incluir solo los del partner seleccionado
              const partnerGroups = get().groups.filter(
                (g) => g.partner_id === partnerId
              );
              set({ groups: partnerGroups });
            }

            return {
              newPerson,
              groupId,
              newGroupSize: newSize,
            };
          } catch (error) {
            console.error("Error in addPersonToGroup:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al añadir persona al grupo: ${error.message}`);
            throw error;
          }
        },

        removePersonFromGroup: async ({ groupId, personId }) => {
          try {
            set({ isLoading: true, error: null });

            // Encontrar el grupo
            const group = get().groups.find((g) => g.id === groupId);
            if (!group) {
              throw new Error("Group not found");
            }

            console.log("Removing person from group:", groupId, personId);

            // Obtener las personas del grupo para verificar si quedaría solo 1 después de eliminar
            const groupPeople = group.people || [];
            console.log("Group people:", groupPeople);

            const remainingPeople = groupPeople.filter(
              (p) => p.id !== personId
            );
            console.log("Remaining people:", remainingPeople);

            // Caso especial: quedaría solo 1 persona en el grupo
            if (remainingPeople.length === 1) {
              const lastPerson = remainingPeople[0];
              console.log("Last person in group:", lastPerson);

              // Convertir la última persona en individual (quitar group_id)
              const { data: updatedPerson, error: updateError } = await supabase
                .from("person")
                .update({ group_id: null })
                .eq("id", lastPerson.id)
                .select()
                .single();

              console.log(
                "Error converting last person to individual:",
                updateError
              );
              if (updateError)
                throw new Error(
                  `Error converting last person to individual: ${updateError}`
                );
              console.log("Updated person:", updatedPerson);

              // Eliminar la persona actual
              const { error: personError } = await supabase
                .from("person")
                .delete()
                .eq("id", personId);

              if (personError)
                throw new Error(
                  `Error removing person: ${personError.message}`
                );

              // Eliminar el grupo ya que no tiene sentido mantenerlo
              const { error: groupDeleteError } = await supabase
                .from("groups")
                .delete()
                .eq("id", groupId);

              console.log("Error deleting group:", groupDeleteError);

              if (groupDeleteError)
                throw new Error(
                  `Error deleting group: ${groupDeleteError.message}`
                );

              // Actualizar estado
              set((state) => {
                // Agregar la persona convertida a individuals
                const newIndividuals = [...state.individuals, updatedPerson];

                // Filtrar el grupo eliminado
                const filteredGroups = state.groups.filter(
                  (g) => g.id !== groupId
                );

                // Actualizar el partner correspondiente
                const partnerId = group.partner_id;
                const updatedPartners = state.partners.map((partner) => {
                  if (partner.id === partnerId) {
                    return {
                      ...partner,
                      groups: (partner.groups || []).filter(
                        (g) => g.id !== groupId
                      ),
                      individuals: [
                        ...(partner.individuals || []),
                        updatedPerson,
                      ],
                    };
                  }
                  return partner;
                });

                const newTotalPersons = state.totalPersons - 1;

                return {
                  groups: filteredGroups,
                  individuals: newIndividuals,
                  partners: updatedPartners,
                  totalPersons: newTotalPersons,
                  isLoading: false,
                };
              });

              // Actualizar PartnerStore
              const partnerId = group.partner_id;
              if (get().selectedPartner?.id === partnerId) {
                // Filtramos tanto grupos como individuales
                const partnerGroups = get().groups.filter(
                  (g) => g.partner_id === partnerId
                );
                const partnerIndividuals = get().individuals.filter(
                  (i) => i.partner_id === partnerId
                );
                set({ groups: partnerGroups });
                set({ individuals: partnerIndividuals });
              }

              return {
                groupId,
                deleted: true,
                convertedPersonId: lastPerson.id,
              };
            }

            // Caso normal: eliminar persona y quedan 2+ personas (o 0 personas)
            // Eliminar la persona
            const { error: personError } = await supabase
              .from("person")
              .delete()
              .eq("id", personId);

            if (personError)
              throw new Error(`Error removing person: ${personError.message}`);

            // Calcular nuevo tamaño
            const newSize = Math.max(0, (group.size || 1) - 1);

            // Si es el último miembro del grupo, eliminar el grupo completo
            if (newSize === 0) {
              // Eliminar el grupo
              const { error: groupDeleteError } = await supabase
                .from("groups")
                .delete()
                .eq("id", groupId);

              if (groupDeleteError)
                throw new Error(
                  `Error deleting group: ${groupDeleteError.message}`
                );

              // Actualizar estado eliminando el grupo
              set((state) => {
                // Filtrar el grupo eliminado
                const filteredGroups = state.groups.filter(
                  (g) => g.id !== groupId
                );

                // También actualizar el partner correspondiente
                const partnerId = group.partner_id;
                const updatedPartners = state.partners.map((partner) => {
                  if (partner.id === partnerId) {
                    return {
                      ...partner,
                      groups: (partner.groups || []).filter(
                        (g) => g.id !== groupId
                      ),
                    };
                  }
                  return partner;
                });

                const newTotalPersons = state.totalPersons - 1;

                return {
                  groups: filteredGroups,
                  partners: updatedPartners,
                  totalPersons: newTotalPersons,
                  isLoading: false,
                };
              });

              // Actualizar PartnerStore
              const partnerId = group.partner_id;
              if (get().selectedPartner?.id === partnerId) {
                // Filtramos los grupos para incluir solo los del partner seleccionado
                const partnerGroups = get().groups.filter(
                  (g) => g.partner_id === partnerId
                );
                set({ groups: partnerGroups });
              }

              return { groupId, deleted: true };
            } else {
              // Si aún quedan personas en el grupo, sólo actualizar el tamaño
              const { error: groupError } = await supabase
                .from("groups")
                .update({ size: newSize })
                .eq("id", groupId);

              if (groupError)
                throw new Error(
                  `Error updating group size: ${groupError.message}`
                );

              // Actualizar estado para el caso normal (no es el último miembro)
              set((state) => {
                // Actualizar el grupo eliminando la persona y ajustando el tamaño
                const updatedGroups = state.groups.map((g) => {
                  if (g.id === groupId) {
                    return {
                      ...g,
                      size: newSize,
                      people: (g.people || []).filter((p) => p.id !== personId),
                    };
                  }
                  return g;
                });

                // También actualizar el partner correspondiente
                const updatedPartners = state.partners.map((partner) => {
                  const groupInPartner = (partner.groups || []).find(
                    (g) => g.id === groupId
                  );
                  if (groupInPartner) {
                    return {
                      ...partner,
                      groups: partner.groups.map((g) => {
                        if (g.id === groupId) {
                          return {
                            ...g,
                            size: newSize,
                            people: (g.people || []).filter(
                              (p) => p.id !== personId
                            ),
                          };
                        }
                        return g;
                      }),
                    };
                  }
                  return partner;
                });

                const newTotalPersons = state.totalPersons - 1;

                return {
                  groups: updatedGroups,
                  partners: updatedPartners,
                  totalPersons: newTotalPersons,
                  isLoading: false,
                };
              });

              // Actualizar PartnerStore para mantener sincronía
              const partnerId = group.partner_id;
              if (get().selectedPartner?.id === partnerId) {
                // Filtramos los grupos para incluir solo los del partner seleccionado
                const partnerGroups = get().groups.filter(
                  (g) => g.partner_id === partnerId
                );
                set({ groups: partnerGroups });
              }

              return { groupId, newGroupSize: newSize };
            }
          } catch (error) {
            console.error("Error in removePersonFromGroup:", error);
            set({ error: error.message, isLoading: false });
            toast.error(
              `Error al eliminar persona del grupo: ${error.message}`
            );
            throw error;
          }
        },

        updatePerson: async (personData) => {
          try {
            set({ isLoading: true, error: null });

            const { id, ...updates } = personData;

            const { data, error } = await supabase
              .from("person")
              .update({
                ...updates,
                updated_at: new Date(),
              })
              .eq("id", id)
              .select()
              .single();

            if (error)
              throw new Error(`Error updating person: ${error.message}`);

            // Actualizar estado
            set((state) => {
              // Primero, determinar si es un individuo o parte de un grupo
              const isIndividual = state.individuals.some((i) => i.id === id);

              if (isIndividual) {
                // Actualizar individuo
                const updatedIndividuals = state.individuals.map((i) =>
                  i.id === id ? { ...i, ...updates } : i
                );

                // También actualizar el partner correspondiente
                const updateIndividualInPartner = state.partners.map(
                  (partner) => {
                    const individualInPartner = (
                      partner.individuals || []
                    ).find((i) => i.id === id);
                    if (individualInPartner) {
                      return {
                        ...partner,
                        individuals: partner.individuals.map((i) =>
                          i.id === id ? { ...i, ...updates } : i
                        ),
                      };
                    }
                    return partner;
                  }
                );

                return {
                  individuals: updatedIndividuals,
                  partners: updateIndividualInPartner,
                  isLoading: false,
                };
              } else {
                // Buscar en qué grupo está esta persona
                let groupId = null;
                let partnerId = null;

                // Buscar en todos los grupos
                state.groups.forEach((group) => {
                  const personInGroup = (group.people || []).find(
                    (p) => p.id === id
                  );
                  if (personInGroup) {
                    groupId = group.id;
                    partnerId = group.partner_id;
                  }
                });

                if (!groupId) {
                  // No se encontró la persona en ningún grupo
                  set({ isLoading: false });
                  return state;
                }

                // Actualizar la persona en el grupo
                const updatedGroups = state.groups.map((group) => {
                  if (group.id === groupId) {
                    return {
                      ...group,
                      people: (group.people || []).map((person) =>
                        person.id === id ? { ...person, ...updates } : person
                      ),
                    };
                  }
                  return group;
                });

                // También actualizar el partner correspondiente
                const updatedPartners = state.partners.map((partner) => {
                  if (partner.id === partnerId) {
                    return {
                      ...partner,
                      groups: (partner.groups || []).map((group) => {
                        if (group.id === groupId) {
                          return {
                            ...group,
                            people: (group.people || []).map((person) =>
                              person.id === id
                                ? { ...person, ...updates }
                                : person
                            ),
                          };
                        }
                        return group;
                      }),
                    };
                  }
                  return partner;
                });

                return {
                  groups: updatedGroups,
                  partners: updatedPartners,
                  isLoading: false,
                };
              }
            });

            // Actualizar PartnerStore
            // Determinar si es individuo o parte de un grupo
            const isIndividual = get().individuals.some((i) => i.id === id);
            if (isIndividual) {
              set({ individuals: [...get().individuals] });
            } else {
              set({ groups: [...get().groups] });
            }

            return data;
          } catch (error) {
            console.error("Error in updatePerson:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al actualizar persona: ${error.message}`);
            throw error;
          }
        },

        // Partner management
        createPartner: async (partnerData) => {
          try {
            set({ isLoading: true, error: null });

            // Extract and format data
            const { name, size, days, startDate } = partnerData;
            const startDateObj = startDate || new Date();
            const formattedStartDate = format(startDateObj, "yyyy-MM-dd");

            // Calculate end date
            const daysCount = parseInt(days) || 5;
            const endDateObj = addDays(startDateObj, daysCount);
            const formattedEndDate = format(endDateObj, "yyyy-MM-dd");

            // Prepare partner data for server action
            const formattedPartnerData = {
              name,
              size: parseInt(size) || 2,
              days: daysCount,
              start_date: formattedStartDate,
              end_date: formattedEndDate,
            };

            // Call server action instead of direct Supabase call
            const result = await createPartnerAction(formattedPartnerData);

            // Handle errors from server action
            if (result.error) {
              throw new Error(result.error);
            }

            // Get the new partner from the result
            const newPartner = result;

            // Refresh partners for the selected date if available
            const selectedDate = useDateStore.getState().selectedDate;
            if (selectedDate) {
              await get().fetchPartnersByDate(selectedDate);
            }

            // Format dates to compare only year/month/day
            const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
            const startDateStr = format(startDateObj, "yyyy-MM-dd");
            const endDateStr = format(endDateObj, "yyyy-MM-dd");

            // Compare dates without time
            if (
              selectedDateStr >= startDateStr &&
              selectedDateStr <= endDateStr
            ) {
              // Set this partner as selected
              get().setSelectedPartner(newPartner);
            }

            return newPartner;
          } catch (error) {
            console.error("Error creating partner:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al crear partner: ${error.message}`);
            throw error;
          }
        },

        deletePartner: async (id) => {
          try {
            set({ isLoading: true, error: null });

            // Get partner data before deletion
            const partnerToDelete = get().partners.find((p) => p.id === id);
            if (!partnerToDelete) {
              throw new Error("Partner not found");
            }

            // Call server action instead of direct Supabase call
            const result = await deletePartnerAction(id);

            // Handle errors from server action
            if (result.error) {
              throw new Error(result.error);
            }

            // Update state
            set((state) => ({
              partners: state.partners.filter((p) => p.id !== id),
              isLoading: false,
            }));

            // If the deleted partner was selected, select another one
            if (get().selectedPartner?.id === id) {
              const nextPartner =
                get().partners.length > 0 ? get().partners[0] : null;

              if (nextPartner) {
                get().setSelectedPartner(nextPartner);
              } else {
                get().setSelectedPartner(null);
              }
            }
            return { id };
          } catch (error) {
            console.error("Error deleting partner:", error);
            set({ error: error.message, isLoading: false });
            toast.error(`Error al eliminar partner: ${error.message}`);
            throw error;
          }
        },

        // Utils
        getPartnerById: (id) => get().partners.find((p) => p.id === id) || null,
        resetError: () => set({ error: null }),

        // Getters for filtering data
        getGroupsByPartnerId: (partnerId) => {
          if (!partnerId) return [];
          return get().groups.filter((group) => group.partner_id === partnerId);
        },

        getIndividualsByPartnerId: (partnerId) => {
          if (!partnerId) return [];
          return get().individuals.filter(
            (individual) => individual.partner_id === partnerId
          );
        },
      };
    },
    {
      name: "traveler-storage", // Unique name for localStorage key
      getStorage: () => localStorage,
      partialize: (state) => ({
        // Only store these properties
        selectedPartner: state.selectedPartner,
        groups: state.groups,
        individuals: state.individuals,
        hostelAssignments: state.hostelAssignments,
      }),
      // Handle any special rehydration logic
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("Traveler store rehydrated from storage");

          // Trigger partner change event if there's a selected partner
          if (state.selectedPartner && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("partner-changed", {
                detail: { partner: state.selectedPartner },
              })
            );
          }
        }
      },
    }
  )
);
