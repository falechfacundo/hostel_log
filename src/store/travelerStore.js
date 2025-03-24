import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { usePartnerStore } from "@/store/partnerStore";
// Import server actions
import {
  fetchPartnersByDate as fetchPartnersByDateAction,
  createPartner as createPartnerAction,
  deletePartner as deletePartnerAction,
} from "@/actions/partner-actions";

// Utility to create a cancellable fetch with retry
const createFetchWithRetry = () => {
  let controller = new AbortController();
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // Function to abort any in-flight request
  const abort = () => {
    controller.abort();
    controller = new AbortController();
  };

  // Function to fetch with retry capability
  const fetchWithRetry = async (actionFn, ...args) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} after tab switch`);
        }

        const result = await actionFn(...args);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);

        // If we've reached max retries, throw the error
        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // Wait a bit before retrying (exponential backoff)
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  };

  return { fetchWithRetry, abort };
};

export const useTravelerStore = create((set, get) => {
  // Create the fetch utility
  const { fetchWithRetry, abort: abortFetch } = createFetchWithRetry();

  // Set up visibility change listener
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      // When the page becomes visible again
      if (document.visibilityState === "visible") {
        const state = get();
        // If we're in a loading state, reset it and retry the last fetch
        if (state.isLoading) {
          console.log("Tab became visible, resetting loading state");
          set({ isLoading: false });

          // Optionally retry the last fetch if we have a lastRequestDate
          if (state.lastRequestDate) {
            console.log("Automatically retrying last fetch after tab switch");
            get().fetchPartnersByDate(state.lastRequestDate);
          }
        }
      }
    });
  }

  return {
    // Core state
    partners: [],
    groups: [],
    individuals: [],
    isLoading: false,
    error: null,
    lastRequestDate: null, // Track the last date requested

    // Data fetching
    fetchPartnersByDate: async (date) => {
      try {
        // Abort any ongoing fetch
        abortFetch();

        set({
          isLoading: true,
          error: null,
          lastRequestDate: date, // Store the date for potential retries
        });

        const dateStr = format(new Date(date), "yyyy-MM-dd");

        console.log("ZUSTAND: Fetching partners by date via Server Action");

        // Use the fetchWithRetry utility
        const result = await fetchWithRetry(fetchPartnersByDateAction, dateStr);

        // Handle error responses from server action
        if (result.error) {
          throw new Error(result.error);
        }

        const { partners, groups, individuals } = result;

        if (!partners?.length) {
          set({ partners: [], groups: [], individuals: [], isLoading: false });
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
        const partnerStore = usePartnerStore.getState();
        const selectedPartner = partnerStore.selectedPartner;

        if (selectedPartner?.id) {
          const currentPartner = partners.find(
            (p) => p.id === selectedPartner.id
          );
          if (currentPartner) {
            partnerStore.setSelectedPartner(currentPartner);
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
      abortFetch();
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

        if (error) throw new Error(`Error fetching groups: ${error.message}`);

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

        // Crear el grupo
        const { data: newGroup, error: groupError } = await supabase
          .from("groups")
          .insert([
            {
              size: groupData.people?.length || 0,
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
            throw new Error(`Error creating people: ${peopleError.message}`);

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
            isLoading: false,
          };
        });

        // Actualizar PartnerStore
        const partnerStore = usePartnerStore.getState();
        if (partnerStore.selectedPartner?.id === partnerId) {
          partnerStore.setGroups([...get().groups]);
        }

        toast.success("Grupo creado correctamente");
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

        const { error } = await supabase.from("groups").delete().eq("id", id);

        if (error) throw new Error(`Error deleting group: ${error.message}`);

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

          return {
            groups: filteredGroups,
            partners: updatedPartners,
            isLoading: false,
          };
        });

        // Actualizar PartnerStore
        const partnerStore = usePartnerStore.getState();
        if (partnerStore.selectedPartner?.id === groupToDelete.partner_id) {
          partnerStore.setGroups(get().groups.filter((g) => g.id !== id));
        }

        toast.success("Grupo eliminado correctamente");
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

          return {
            individuals: newIndividuals,
            partners: updatedPartners,
            isLoading: false,
          };
        });

        // Actualizar PartnerStore
        const partnerStore = usePartnerStore.getState();
        if (partnerStore.selectedPartner?.id === individualData.partnerId) {
          partnerStore.setIndividuals([...get().individuals]);
        }

        toast.success("Persona creada correctamente");
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
        const individualToDelete = get().individuals.find((i) => i.id === id);
        if (!individualToDelete) {
          throw new Error("Individual not found");
        }

        const { error } = await supabase.from("person").delete().eq("id", id);

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

          return {
            individuals: filteredIndividuals,
            partners: updatedPartners,
            isLoading: false,
          };
        });

        // Actualizar PartnerStore
        const partnerStore = usePartnerStore.getState();
        if (
          partnerStore.selectedPartner?.id === individualToDelete.partner_id
        ) {
          partnerStore.setIndividuals(
            get().individuals.filter((i) => i.id !== id)
          );
        }

        toast.success("Persona eliminada correctamente");
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

          return {
            groups: updatedGroups,
            partners: updatedPartners,
            isLoading: false,
          };
        });

        // Actualizar PartnerStore
        const partnerStore = usePartnerStore.getState();
        if (partnerStore.selectedPartner?.id === partnerId) {
          partnerStore.setGroups([...get().groups]);
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

        // Eliminar la persona
        const { error: personError } = await supabase
          .from("person")
          .delete()
          .eq("id", personId);

        if (personError)
          throw new Error(`Error removing person: ${personError.message}`);

        // Calcular nuevo tamaño
        const newSize = Math.max(0, (group.size || 1) - 1);

        // Actualizar el tamaño del grupo
        const { error: groupError } = await supabase
          .from("groups")
          .update({ size: newSize })
          .eq("id", groupId);

        if (groupError)
          throw new Error(`Error updating group size: ${groupError.message}`);

        // Actualizar estado
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
                      people: (g.people || []).filter((p) => p.id !== personId),
                    };
                  }
                  return g;
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
        });

        // Actualizar PartnerStore para mantener sincronía
        const partnerStore = usePartnerStore.getState();
        const partnerId = group.partner_id;
        if (partnerStore.selectedPartner?.id === partnerId) {
          partnerStore.setGroups([...get().groups]);
        }

        return { groupId, newGroupSize: newSize };
      } catch (error) {
        console.error("Error in removePersonFromGroup:", error);
        set({ error: error.message, isLoading: false });
        toast.error(`Error al eliminar persona del grupo: ${error.message}`);
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

        if (error) throw new Error(`Error updating person: ${error.message}`);

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
            const updateIndividualInPartner = state.partners.map((partner) => {
              const individualInPartner = (partner.individuals || []).find(
                (i) => i.id === id
              );
              if (individualInPartner) {
                return {
                  ...partner,
                  individuals: partner.individuals.map((i) =>
                    i.id === id ? { ...i, ...updates } : i
                  ),
                };
              }
              return partner;
            });

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
                          person.id === id ? { ...person, ...updates } : person
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
        const partnerStore = usePartnerStore.getState();
        // Determinar si es individuo o parte de un grupo
        const isIndividual = get().individuals.some((i) => i.id === id);
        if (isIndividual) {
          partnerStore.setIndividuals([...get().individuals]);
        } else {
          partnerStore.setGroups([...get().groups]);
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
          size: parseInt(size) || 0,
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

        // Update state
        set((state) => ({
          partners: [...state.partners, newPartner],
          isLoading: false,
        }));

        // Update PartnerStore
        const partnerStore = usePartnerStore.getState();

        // Automatically select the new partner
        partnerStore.setSelectedPartner(newPartner);
        partnerStore.setGroups([]);
        partnerStore.setIndividuals([]);

        toast.success(`Partner "${newPartner.name}" creado correctamente`);
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

        // Update PartnerStore
        const partnerStore = usePartnerStore.getState();

        // If the deleted partner was selected, select another one
        if (partnerStore.selectedPartner?.id === id) {
          const nextPartner =
            get().partners.length > 0 ? get().partners[0] : null;

          if (nextPartner) {
            partnerStore.setSelectedPartner(nextPartner);
            if (nextPartner.groups) partnerStore.setGroups(nextPartner.groups);
            if (nextPartner.individuals)
              partnerStore.setIndividuals(nextPartner.individuals);
          } else {
            partnerStore.setSelectedPartner(null);
            partnerStore.setGroups([]);
            partnerStore.setIndividuals([]);
          }
        }

        toast.success(
          `Partner "${partnerToDelete.name}" eliminado correctamente`
        );
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
});

/**
 * Hook para usar el store de travelers
 * Este hook expone una API similar a useTravelers para facilitar la migración
 */
export function useTravelers(initialDate = new Date()) {
  // Usamos usePartnerStore para acceder a su estado
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const groups = usePartnerStore((state) => state.groups);
  const individuals = usePartnerStore((state) => state.individuals);
  const hostelAssignments = usePartnerStore((state) => state.hostelAssignments);

  // Obtenemos los datos y funciones del store
  const {
    partners,
    isLoading,
    error,
    fetchPartnersByDate,
    createPartner,
    deletePartner,
    createGroup,
    deleteGroup,
    createIndividual,
    deleteIndividual,
    addPersonToGroup,
    removePersonFromGroup,
    updatePerson,
    selectPartner,
  } = useTravelerStore((state) => state);

  // Función para refrescar los partners
  const refetchPartners = async (date = initialDate) => {
    return await fetchPartnersByDate(date);
  };

  // Esta función mantiene la misma API que el hook original
  return {
    // Partners data
    partners,
    selectedPartner,
    selectPartner,
    isLoadingPartners: isLoading,
    addPartner: createPartner,
    deletePartner,
    refetchPartners,

    // Travelers data
    individuals,
    groups,
    hostelAssignments,

    // Status
    isLoading,
    error,

    // Operations for individuals
    addIndividual: createIndividual,
    updateIndividual: updatePerson,
    removeIndividual: deleteIndividual,

    // Operations for groups
    addGroup: createGroup,
    updateGroup: (data) => updatePerson(data),
    deleteGroup,

    // Group membership operations
    addPersonToGroup,
    removePersonFromGroup,

    // Update person operation
    updatePerson,
  };
}
