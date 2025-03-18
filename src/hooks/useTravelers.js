import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

import { usePartnerStore } from "@/store/partnerStore";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { hostelAssignmentKeys } from "@/hooks/useHostelAssignments";

export const selectedPartnerKey = "selectedPartner";

// Query keys para travelers
export const travelerKeys = {
  all: ["travelers"],
  lists: () => [...travelerKeys.all, "list"],
  list: (filters) => [...travelerKeys.lists(), { filters }],
  details: () => [...travelerKeys.all, "detail"],
  detail: (id) => [...travelerKeys.details(), id],

  // Específico por fecha y partner
  byDateAndPartner: (date, partnerId) => [
    ...travelerKeys.lists(),
    { date, partnerId },
  ],

  // Specific keys for types
  individuals: {
    all: ["individuals"],
    lists: () => [...travelerKeys.individuals.all, "list"],
    list: (filters) => [...travelerKeys.individuals.lists(), { filters }],
    detail: (id) => [...travelerKeys.individuals.all, "detail", id],
  },
  groups: {
    all: ["groups"],
    lists: () => [...travelerKeys.groups.all, "list"],
    list: (filters) => [...travelerKeys.groups.lists(), { filters }],
    detail: (id) => [...travelerKeys.groups.all, "detail", id],
  },
};

// Clave para partners
export const partnerKeys = {
  all: ["partners"],
  lists: () => [...partnerKeys.all, "list"],
  list: (filters) => [...partnerKeys.lists(), { filters }],
  byDate: (date) => [...partnerKeys.lists(), { date }],
  details: () => [...partnerKeys.all, "detail"],
  detail: (id) => [...partnerKeys.details(), id],
  assignments: () => [...partnerKeys.all, "assignments"],
  assignmentsByDate: (date) => [...partnerKeys.assignments(), { date }],
};

// Función para obtener partners según la fecha
const fetchPartnersByDate = async (date) => {
  const dateStr = format(new Date(date), "yyyy-MM-dd");

  try {
    // Modificamos la consulta para obtener partners donde la fecha seleccionada esté dentro del rango
    const { data: partners, error } = await supabase
      .from("partners")
      .select("*")
      .lte("start_date", dateStr) // start_date <= selectedDate
      .gte("end_date", dateStr) // end_date >= selectedDate
      .order("name");

    if (error) throw error;

    // If no partners found, return empty array
    if (!partners || partners.length === 0) {
      return [];
    }

    // For each partner, fetch its groups and individuals
    const partnersWithRelatedData = await Promise.all(
      partners.map(async (partner) => {
        try {
          // Fetch groups for this partner
          const groups = await fetchGroups(partner.id);

          // Fetch individuals for this partner
          const individuals = await fetchIndividuals(partner.id);

          const hostelAssignments = await fetchHostelAssignments(partner.id);

          // Return partner with its related data
          return {
            ...partner,
            groups,
            individuals,
            hostelAssignments,
          };
        } catch (err) {
          console.error(
            `Error fetching related data for partner ${partner.id}:`,
            err
          );
          // Return partner with empty related data
          return {
            ...partner,
            groups: [],
            individuals: [],
          };
        }
      })
    );

    return partnersWithRelatedData;
  } catch (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
};

// Fetch all individuals (persons without a group)
const fetchIndividuals = async (partnerId) => {
  if (!partnerId) {
    console.log(
      "No partner ID provided for fetching individuals, returning empty array"
    );
    return [];
  }

  // Extract ID if partnerId is an object
  const actualPartnerId =
    typeof partnerId === "object" && partnerId !== null
      ? partnerId.id || null
      : partnerId;

  // Only proceed with the query if we have a valid partner ID
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

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching individuals:", error);
    return [];
  }
};

// Fetch all groups with their people
const fetchGroups = async (partnerId) => {
  if (!partnerId) {
    console.log(
      "No partner ID provided for fetching groups, returning empty array"
    );
    return [];
  }

  // Extract ID if partnerId is an object
  const actualPartnerId =
    typeof partnerId === "object" && partnerId !== null
      ? partnerId.id || null
      : partnerId;

  // Only proceed with the query if we have a valid partner ID
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

    if (error) throw error;

    // Format data to match the original structure
    return data.map((group) => ({
      ...group,
      people: group.person || [],
    }));
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
};

// Fetch hostel assignments for a specific partner
const fetchHostelAssignments = async (partnerId) => {
  if (!partnerId) {
    console.log(
      "No partner ID provided for fetching hostel assignments, returning empty array"
    );
    return [];
  }

  // Extract ID if partnerId is an object
  const actualPartnerId =
    typeof partnerId === "object" && partnerId !== null
      ? partnerId.id || null
      : partnerId;

  // Only proceed with the query if we have a valid partner ID
  if (!actualPartnerId) {
    console.log(
      "Invalid partner ID for hostel assignments, returning empty array"
    );
    return [];
  }

  try {
    // Check if we already have cached data in the query client
    const cachedData = queryClient.getQueryData(
      hostelAssignmentKeys.byPartnerId(actualPartnerId)
    );

    if (cachedData) {
      console.log("Using cached hostel assignments");
      return cachedData;
    }

    const { data, error } = await supabase
      .from("hostel_partner_assignments")
      .select(
        `
        *,
        hostel:hostels(*)
      `
      )
      .eq("partner_id", actualPartnerId);

    if (error) throw error;

    // Store the result in the query cache
    queryClient.setQueryData(
      hostelAssignmentKeys.byPartnerId(actualPartnerId),
      data || []
    );

    return data || [];
  } catch (error) {
    console.error("Error fetching hostel assignments:", error);
    return [];
  }
};

// Create a new partner
const createPartner = async (partnerData) => {
  const { data, error } = await supabase
    .from("partners")
    .insert([
      {
        name: partnerData.name,
        size: partnerData.size || 0,
        days: partnerData.days || 5,
        start_date: partnerData.start_date || format(new Date(), "yyyy-MM-dd"),
        end_date: partnerData.end_date || format(new Date(), "yyyy-MM-dd"),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a partner
const deletePartner = async (id) => {
  const { error } = await supabase.from("partners").delete().eq("id", id);

  if (error) throw error;
  return { id };
};

// Pre-initialize the cache for selectedPartnerKey to prevent undefined issues
// This ensures the cache always has a value, even if it's null
if (queryClient.getQueryData(selectedPartnerKey) === undefined) {
  queryClient.setQueryData(selectedPartnerKey, null);
}

// Hook combinado para manejar partners y travelers
export function useTravelers(initialDate = new Date()) {
  // Estado para la fecha actual - usamos el formato string para queries
  const dateStr = format(initialDate, "yyyy-MM-dd");

  // Use ref for tracking render count to help debug excessive renders
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  const {
    partners: storePartners,

    individuals: storeIndividuals,
    groups: storeGroups,

    addGroup: storeAddGroup,
    removeGroup: storeRemoveGroup,
    updateGroup: storeUpdateGroup,
    addIndividual: storeAddIndividual,
    removeIndividual: storeRemoveIndividual,
    updateIndividual: storeUpdateIndividual,

    hostelAssignments: storeHostelAssignments,
  } = usePartnerStore();

  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const setSelectedPartner = usePartnerStore(
    (state) => state.setSelectedPartner
  );
  // const partners = usePartnerStore((state) => state.partners);
  const setPartners = usePartnerStore((state) => state.setPartners);

  // const individuals = usePartnerStore((state) => state.individuals);
  // const groups = usePartnerStore((state) => state.groups);

  const setGroups = usePartnerStore((state) => state.setGroups);
  const setIndividuals = usePartnerStore((state) => state.setIndividuals);
  // const addGroup = usePartnerStore((state) => state.addGroup);
  // const removeGroup = usePartnerStore((state) => state.removeGroup);
  // const updateGroup = usePartnerStore((state) => state.updateGroup);
  // const addIndividual = usePartnerStore((state) => state.addIndividual);
  // const removeIndividual = usePartnerStore((state) => state.removeIndividual);
  // const updateIndividual = usePartnerStore((state) => state.updateIndividual);

  // const hostelAssignments = usePartnerStore((state) => state.hostelAssignments);
  const setHostelAssignments = usePartnerStore(
    (state) => state.setHostelAssignments
  );

  // This is the first query that runs when the app loads
  const {
    data: partners = [],
    isLoading: isLoadingPartners,
    error: partnersError,
    refetch: refetchPartnersQuery,
  } = useQuery({
    queryKey: partnerKeys.byDate(dateStr),
    queryFn: () => fetchPartnersByDate(initialDate),
    staleTime: 60000, // Consider data fresh for 1 minute
    onSuccess: (data) => {
      // Sync fetched partners with our store

      setPartners(data);

      // If we have a selected partner, update its groups and individuals in the store
      if (selectedPartner?.id) {
        const currentPartner = data.find((p) => p.id === selectedPartner.id);
        if (currentPartner) {
          // Update groups and individuals for the selected partner
          if (currentPartner.groups) setGroups(currentPartner.groups);
          if (currentPartner.individuals)
            setIndividuals(currentPartner.individuals);
          // Add this line to update hostelAssignments in the store
          if (currentPartner.hostelAssignments)
            setHostelAssignments(currentPartner.hostelAssignments);
        }
      }
    },
  });

  // Replace the selectPartner function to use our store
  const selectPartner = useCallback(
    (partner) => {
      return setSelectedPartner(partner);
    },
    [setSelectedPartner]
  );

  // Auto-select first partner only if needed and available
  useEffect(() => {
    if (partners.length > 0 && !selectedPartner) {
      // Use a small delay to avoid render cycles
      const timeoutId = setTimeout(() => {
        selectPartner(partners[0]);

        // Also update groups and individuals from the first partner
        if (partners[0].groups) setGroups(partners[0].groups);
        if (partners[0].individuals) setIndividuals(partners[0].individuals);
        // Add this line to update hostelAssignments for the first partner
        if (partners[0].hostelAssignments)
          setHostelAssignments(partners[0].hostelAssignments);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [partners.length, selectedPartner, selectPartner]);

  // Mutations para partners
  const createPartnerMutation = useMutation({
    mutationFn: createPartner,
    onSuccess: async (newPartner) => {
      // Instead of manually adding to the array, we'll:
      // 1. Prepare the new partner just for initial selection
      const preparedPartner = {
        ...newPartner,
        groups: [],
        individuals: [],
        hostelAssignments: [],
      };

      // 2. Invalidate the queries to force a fresh fetch
      const dateStr = format(initialDate, "yyyy-MM-dd");
      await queryClient.invalidateQueries({
        queryKey: partnerKeys.byDate(dateStr),
        refetchActive: true, // Force an immediate refetch
      });

      // 3. Temporarily select the new partner for UI responsiveness
      // but don't manually update the partners array
      selectPartner(preparedPartner);
      setGroups([]);
      setIndividuals([]);

      // 4. Explicitly refetch to ensure we have fresh data
      await refetchPartnersQuery();

      // Note: We're NOT manually updating the partners array anymore
      // Instead letting the query refetch handle that
    },
    onError: (err) => {
      toast.error(`Error al crear partner: ${err.message}`);
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: deletePartner,
    onMutate: async (id) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: partnerKeys.lists() });
      await queryClient.cancelQueries({ queryKey: partnerKeys.detail(id) });

      // Snapshot the previous value
      const previousPartners = queryClient.getQueryData(partnerKeys.lists());

      // Optimistically remove the partner from the cache
      if (previousPartners) {
        const updatedPartners = previousPartners.filter((p) => p.id !== id);
        queryClient.setQueryData(partnerKeys.lists(), updatedPartners);

        // Also update the store
        setPartners(updatedPartners);

        // If we're deleting the currently selected partner, reset selection
        const currentSelectedPartner =
          queryClient.getQueryData(selectedPartnerKey);
        if (currentSelectedPartner && currentSelectedPartner.id === id) {
          // Select a different partner or set to null
          const newSelection =
            updatedPartners.length > 0 ? updatedPartners[0] : null;
          queryClient.setQueryData(selectedPartnerKey, newSelection);

          // Also update groups and individuals if needed
          if (newSelection) {
            if (newSelection.groups) setGroups(newSelection.groups);
            if (newSelection.individuals)
              setIndividuals(newSelection.individuals);
          } else {
            setGroups([]);
            setIndividuals([]);
          }
        }
      }

      return { previousPartners };
    },
    onSuccess: ({ id }) => {
      // Remove from cache completely
      queryClient.removeQueries({ queryKey: partnerKeys.detail(id) });
    },
    onError: (err, id, context) => {
      toast.error(`Error al eliminar partner: ${err.message}`);

      // Rollback to the previous state if we have it
      if (context?.previousPartners) {
        queryClient.setQueryData(partnerKeys.lists(), context.previousPartners);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to be sure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
    },
  });

  // Función para refrescar los partners con una nueva fecha
  const refetchPartners = useCallback(
    async (date) => {
      if (date) {
        const newDateStr = format(new Date(date), "yyyy-MM-dd");
        queryClient.invalidateQueries({
          queryKey: partnerKeys.byDate(newDateStr),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: partnerKeys.byDate(dateStr),
        });
      }

      return await refetchPartnersQuery();
    },
    [dateStr, refetchPartnersQuery]
  );

  // Incluir resto de operaciones sobre travelers del hook original
  // Create a new individual
  const createIndividual = async (individualData) => {
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

    if (error) throw error;
    return data;
  };

  // Create a new group with people in a single transaction
  const createGroup = async (groupData) => {
    // First create the group
    const { partnerId } = groupData;
    console.log("Creating group with partner ID:", groupData);

    const { data: newGroup, error: groupError } = await supabase
      .from("groups")
      .insert([
        {
          size: groupData.people?.length || 0,
          partner_id: partnerId, // Asignar el partner_id correctamente
        },
      ])
      .select()
      .single();

    if (groupError) throw groupError;

    // If there are people, create them
    if (groupData.people && groupData.people.length > 0) {
      const peopleToInsert = groupData.people.map((person) => ({
        name: person.name,
        backpack: person.backpack || false, // Asegurarse de incluir el estado de la mochila
        group_id: newGroup.id,
        partner_id: partnerId, // Asignar el mismo partner_id a los miembros del grupo
      }));

      const { data: people, error: peopleError } = await supabase
        .from("person")
        .insert(peopleToInsert)
        .select();

      if (peopleError) throw peopleError;

      return {
        ...newGroup,
        people,
      };
    }

    return {
      ...newGroup,
      people: [],
    };
  };

  // Update an individual
  const updateIndividual = async ({ id, data }) => {
    const { data: updatedData, error } = await supabase
      .from("person")
      .update({ name: data.name, backpack: data.backpack })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedData;
  };

  // Update a group
  const updateGroup = async ({ id, data }) => {
    const { data: updatedGroup, error } = await supabase
      .from("groups")
      .update({
        name: data.name,
        size: data.size || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedGroup;
  };
  const deleteGroup = async (id) => {
    // Primero, obtenemos los datos actuales del grupo para tener el contexto completo
    const { data: groupToDelete, error: fetchError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Eliminamos el grupo
    const { error } = await supabase.from("groups").delete().eq("id", id);

    if (error) throw error;

    // Retornamos el grupo completo para tener toda la información disponible
    return groupToDelete;
  };

  // Delete an individual
  const deleteIndividual = async (id) => {
    const { error } = await supabase.from("person").delete().eq("id", id);

    if (error) throw error;
    return { id };
  };

  // Replace the addPersonToGroup function with this improved version
  const addPersonToGroup = async ({ group, personData }) => {
    console.log("Adding person to group with ID:", group.id);

    // Make sure we have the correct partner_id
    const partnerId = selectedPartner?.id || group.partner_id;

    // Add the person with complete data
    const { data: newPerson, error } = await supabase
      .from("person")
      .insert([
        {
          name: personData.name,
          group_id: group.id,
        },
      ])
      .select();

    if (error) throw error;

    // Calculate the new size
    const newSize = group.size + 1;

    try {
      const { data, error } = await supabase
        .from("groups")
        .update({ size: newSize, updated_at: new Date() })
        .eq("id", group.id)
        .select();

      // Return complete data for UI update
      return {
        newPerson: newPerson[0],
        groupId: group.id,
        newGroupSize: newSize,
      };
    } catch (err) {
      console.warn("Error updating group size, but person was added:", err);
      // Return the person data so UI can still update
      return {
        newPerson: newPerson[0],
        groupId: group.id,
        newGroupSize: newSize,
      };
    }
  };

  // Añadir la función de actualización de persona
  const updatePerson = async (personData) => {
    const { id, ...updates } = personData;
    console.log("Updating person backpack:", updates.backpack);

    const { data, error } = await supabase
      .from("person")
      .update({ backpack: updates.backpack, updated_at: new Date() })
      .eq("id", id);

    if (error) throw error;

    return data;
  };

  // Add this function after other database functions like addPersonToGroup
  const removePersonFromGroup = async ({ groupId, personId }) => {
    console.log("Removing person from group with ID:", groupId);

    // First, fetch the current group to get its size
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("size, partner_id")
      .eq("id", groupId)
      .single();

    if (groupError) throw groupError;

    const { data: updatedPerson, error: personError } = await supabase
      .from("person")
      .delete()
      .eq("id", personId);

    // if (personError) throw personError;

    // Calculate new size based on the fetched group size
    const newSize = Math.max(0, (group?.size || 1) - 1);

    const { error: updateError } = await supabase
      .from("groups")
      .update({ size: newSize })
      .eq("id", groupId);

    // if (updateError) throw updateError;

    return { updatedPerson, groupId, newGroupSize: newSize };
  };

  // Derived loading and error states - updated to use only travelers query
  const isLoading = useMemo(() => isLoadingPartners, [isLoadingPartners]);

  // Add an individual - update store after success
  const addIndividualMutation = useMutation({
    mutationFn: createIndividual,
    onSuccess: (newIndividual) => {
      // Update cache with new individual to avoid refetching
      queryClient.setQueryData(
        travelerKeys.individuals.lists(),
        (oldData = []) => [...oldData, newIndividual]
      );

      // Also update our Zustand store
      storeAddIndividual(newIndividual);
    },
    onError: (err) => {},
    onSettled: () => {
      // Invalidate only after all operations complete
      queryClient.invalidateQueries({
        queryKey: travelerKeys.individuals.lists(),
      });
    },
  });

  // Add a group - update store after success
  const addGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      // Update cache with new group to avoid refetching
      queryClient.setQueryData(travelerKeys.groups.lists(), (oldData = []) => [
        ...oldData,
        newGroup,
      ]);

      // Also update our Zustand store
      storeAddGroup(newGroup);
    },
    onError: (err) => {},
    onSettled: () => {
      // Invalidate only after all operations complete
      queryClient.invalidateQueries({ queryKey: travelerKeys.groups.lists() });
    },
  });

  // Update an individual
  const updateIndividualMutation = useMutation({
    mutationFn: updateIndividual,
    onMutate: async ({ id, data }) => {
      // Optimistic update for individual
      await queryClient.cancelQueries({
        queryKey: travelerKeys.individuals.detail(id),
      });
      const previousIndividual = queryClient.getQueryData(
        travelerKeys.individuals.detail(id)
      );

      queryClient.setQueryData(travelerKeys.individuals.detail(id), (old) => ({
        ...old,
        name: data.name,
        backpack: data.backpack,
      }));

      return { previousIndividual };
    },
    onSuccess: (updatedIndividual) => {},
    onError: (err, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousIndividual) {
        queryClient.setQueryData(
          travelerKeys.individuals.detail(variables.id),
          context.previousIndividual
        );
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: travelerKeys.individuals.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: travelerKeys.individuals.lists(),
      });
    },
  });

  // Update a group
  const updateGroupMutation = useMutation({
    mutationFn: updateGroup,
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({
        queryKey: travelerKeys.groups.detail(updatedGroup.id),
      });
      queryClient.invalidateQueries({ queryKey: travelerKeys.groups.lists() });
    },
    onError: (err) => {},
  });

  // Mejoremos la mutación para manejar más efectivamente la UI
  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onMutate: async (id) => {
      // Cancelar todas las consultas pendientes para evitar actualizaciones conflictivas
      await queryClient.cancelQueries();

      // Guardar el estado previo de los datos
      const previousGroups = queryClient.getQueryData(
        travelerKeys.groups.lists()
      );

      // También guardamos los datos filtrados por fecha si existen
      const currentDate = new Date();
      const dateKey = format(currentDate, "yyyy-MM-dd");
      const previousFilteredData = queryClient.getQueryData([
        ...travelerKeys.all,
        { date: dateKey },
      ]);

      // Actualización optimista en la lista principal de grupos
      if (previousGroups) {
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          previousGroups.filter((group) => group.id !== id)
        );
      }

      // Actualización optimista en los datos filtrados por fecha
      if (previousFilteredData) {
        const updatedFilteredData = {
          ...previousFilteredData,
          groups: previousFilteredData.groups.filter(
            (group) => group.id !== id
          ),
        };
        queryClient.setQueryData(
          [...travelerKeys.all, { date: dateKey }],
          updatedFilteredData
        );
      }

      // Also update our Zustand store optimistically
      storeRemoveGroup(id);

      return { previousGroups, previousFilteredData, dateKey };
    },

    onSuccess: (deletedGroup) => {
      // Invalidar TODAS las consultas relacionadas con grupos
      queryClient.invalidateQueries({ queryKey: travelerKeys.groups.all });

      // Invalidar también las consultas que combinan grupos e individuos
      queryClient.invalidateQueries({ queryKey: travelerKeys.all });

      // Eliminar específicamente la consulta de detalle del grupo
      queryClient.removeQueries({
        queryKey: travelerKeys.groups.detail(deletedGroup.id),
      });
    },

    onError: (err, id, context) => {
      // Restaurar todos los datos previos en caso de error
      if (context?.previousGroups) {
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          context.previousGroups
        );
      }

      if (context?.previousFilteredData) {
        queryClient.setQueryData(
          [...travelerKeys.all, { date: context.dateKey }],
          context.previousFilteredData
        );
      }
    },

    onSettled: () => {
      // Forzar una actualización completa de todas las consultas de viajeros
      queryClient.invalidateQueries({ queryKey: travelerKeys.all });
    },
  });

  // Delete an individual
  const deleteIndividualMutation = useMutation({
    mutationFn: deleteIndividual,
    onMutate: async (id) => {
      // Optimistic update - remove from cache immediately
      await queryClient.cancelQueries({
        queryKey: travelerKeys.individuals.lists(),
      });
      const previousIndividuals = queryClient.getQueryData(
        travelerKeys.individuals.lists()
      );

      queryClient.setQueryData(travelerKeys.individuals.lists(), (old = []) =>
        old.filter((individual) => individual.id !== id)
      );

      // Also update our Zustand store optimistically
      storeRemoveIndividual(id);

      return { previousIndividuals };
    },
    onSuccess: ({ id }) => {
      queryClient.removeQueries({
        queryKey: travelerKeys.individuals.detail(id),
      });
    },
    onError: (err, id, context) => {
      // Rollback to previous data
      if (context?.previousIndividuals) {
        queryClient.setQueryData(
          travelerKeys.individuals.lists(),
          context.previousIndividuals
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: travelerKeys.individuals.lists(),
      });
    },
  });

  // Replace the addPersonToGroupMutation with this optimistic version
  const addPersonToGroupMutation = useMutation({
    mutationFn: addPersonToGroup,

    // Add optimistic updates
    onMutate: async ({ group, personData }) => {
      // Cancel pending queries to avoid conflicts
      await queryClient.cancelQueries({
        queryKey: travelerKeys.groups.lists(),
      });

      // Get current groups data
      const previousGroups = queryClient.getQueryData(
        travelerKeys.groups.lists()
      );

      // Create a temporary person object with all required fields
      const tempPerson = {
        id: `temp-${Date.now()}`, // Temporary ID until we get the real one
        name: personData.name,
        group_id: group.id,
        backpack: personData.backpack || false,
        partner_id: selectedPartner?.id || group.partner_id,
      };

      // Update the cache optimistically
      if (previousGroups) {
        const updatedGroups = previousGroups.map((g) => {
          if (g.id === group.id) {
            // Add the new person to this group and increment size
            return {
              ...g,
              people: [...(g.people || []), tempPerson],
              size: (g.size || 0) + 1,
            };
          }
          return g;
        });

        // Update both the React Query cache and Zustand store
        queryClient.setQueryData(travelerKeys.groups.lists(), updatedGroups);
        setGroups(updatedGroups);
      }

      // Return previous data for potential rollback
      return { previousGroups };
    },

    onSuccess: (result, { group }) => {
      // Get the returned data
      const { newPerson, groupId, newGroupSize } = result;

      // Get current data from cache
      const currentGroups = queryClient.getQueryData(
        travelerKeys.groups.lists()
      );

      if (currentGroups && newPerson) {
        // Replace temp entry with real data
        const finalGroups = currentGroups.map((g) => {
          if (g.id === groupId) {
            return {
              ...g,
              // Remove any temporary entries and add the real person data
              people: [
                ...g.people.filter((p) => !String(p.id).startsWith("temp-")),
                newPerson,
              ],
              size: newGroupSize,
            };
          }
          return g;
        });

        // Update both cache and store
        queryClient.setQueryData(travelerKeys.groups.lists(), finalGroups);
        setGroups(finalGroups);
      }
    },

    onError: (err, variables, context) => {
      // Restore previous state if operation fails
      if (context?.previousGroups) {
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          context.previousGroups
        );
        setGroups(context.previousGroups);
      }
    },
  });

  // Mejorar la mutación para actualizar persona (backpack toggle)
  const updatePersonMutation = useMutation({
    mutationFn: updatePerson,
    onMutate: async (personData) => {
      // Claves para actualizar
      const { id } = personData;
      const individualKey = travelerKeys.individuals.lists();
      const groupsKey = travelerKeys.groups.lists();

      // Cancelar consultas pendientes
      await queryClient.cancelQueries({ queryKey: individualKey });
      await queryClient.cancelQueries({ queryKey: groupsKey });

      // Guardar estado previo
      const previousIndividuals = queryClient.getQueryData(individualKey);
      const previousGroups = queryClient.getQueryData(groupsKey);

      // Actualización optimista para individuales
      if (previousIndividuals) {
        queryClient.setQueryData(individualKey, (oldIndividuals = []) =>
          oldIndividuals.map((ind) =>
            ind.id === id ? { ...ind, ...personData } : ind
          )
        );
      }

      // Actualización optimista para miembros de grupos
      if (previousGroups) {
        queryClient.setQueryData(groupsKey, (oldGroups = []) =>
          oldGroups.map((group) => ({
            ...group,
            people: (group.people || []).map((person) =>
              person.id === id ? { ...person, ...personData } : person
            ),
          }))
        );
      }

      return { previousIndividuals, previousGroups };
    },
    onSuccess: (updatedPerson) => {},
    onError: (err, personData, context) => {
      // Restaurar estado previo en caso de error
      if (context?.previousIndividuals) {
        queryClient.setQueryData(
          travelerKeys.individuals.lists(),
          context.previousIndividuals
        );
      }

      if (context?.previousGroups) {
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          context.previousGroups
        );
      }
    },
    onSettled: () => {
      // Invalidar consultas después de la operación
      queryClient.invalidateQueries({
        queryKey: travelerKeys.individuals.lists(),
      });
      queryClient.invalidateQueries({ queryKey: travelerKeys.groups.lists() });
    },
  });

  // Add this mutation after other mutations
  const removePersonFromGroupMutation = useMutation({
    mutationFn: removePersonFromGroup,
    onMutate: async ({ groupId, personId }) => {
      // Cancel any outgoing queries that might affect our data
      await queryClient.cancelQueries({
        queryKey: travelerKeys.groups.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: travelerKeys.groups.detail(groupId),
      });

      // Snapshot all previous values we might need to restore
      const previousGroups = queryClient.getQueryData(
        travelerKeys.groups.lists()
      );

      // Find the person being removed and their group for later use
      let removedPerson = null;
      let currentGroup = null;

      if (previousGroups) {
        currentGroup = previousGroups.find((g) => g.id === groupId);
        if (currentGroup && currentGroup.people) {
          removedPerson = currentGroup.people.find((p) => p.id === personId);
        }
      }

      // Optimistically update both the cache and the Zustand store
      if (previousGroups) {
        // Update the React Query cache
        const updatedGroups = previousGroups.map((group) => {
          if (group.id === groupId) {
            // Remove the person and update the group size in one operation
            const filteredPeople = (group.people || []).filter(
              (person) => person.id !== personId
            );

            return {
              ...group,
              people: filteredPeople,
              size: Math.max(0, (group.size || 1) - 1),
            };
          }
          return group;
        });

        queryClient.setQueryData(travelerKeys.groups.lists(), updatedGroups);

        // Also update the Zustand store with the same changes
        setGroups(updatedGroups);
      }

      // Return previous state for potential rollback
      return {
        previousGroups,
        removedPerson,
        currentGroup,
      };
    },

    onSuccess: (result, variables) => {
      // After successful DB operation, ensure UI is completely in sync
      const { groupId, newGroupSize } = result;

      // Update any direct references to ensure UI is consistent
      const currentGroups = queryClient.getQueryData(
        travelerKeys.groups.lists()
      );
      if (currentGroups) {
        const finalGroups = currentGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              size: newGroupSize, // Ensure size matches exactly what server returned
            };
          }
          return group;
        });

        // Update both cache and store to ensure consistency
        queryClient.setQueryData(travelerKeys.groups.lists(), finalGroups);
        setGroups(finalGroups);
      }
    },

    onError: (err, variables, context) => {
      // Rollback all changes if there was an error
      if (context?.previousGroups) {
        queryClient.setQueryData(
          travelerKeys.groups.lists(),
          context.previousGroups
        );

        // Also restore the store
        setGroups(context.previousGroups);
      }
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: travelerKeys.groups.lists() });
    },
  });

  return useMemo(
    () => ({
      // Partners data & operations
      partners: storePartners.length > 0 ? storePartners : partners,
      selectedPartner, // This will now be reactive through the Zustand store
      selectPartner,
      isLoadingPartners,
      addPartner: createPartnerMutation.mutate,
      deletePartner: deletePartnerMutation.mutate,
      refetchPartners, // Now properly defined above

      // Travelers data - use data from the store
      individuals: storeIndividuals,
      groups: storeGroups,
      // Add this line to expose hostelAssignments from the store
      hostelAssignments: storeHostelAssignments,

      // Status & errors
      isLoading,
      error: partnersError,

      // Rest of travelers operations (unchanged)
      // Create a new individual
      addIndividual: addIndividualMutation.mutate,
      updateIndividual: updateIndividualMutation.mutate,
      removeIndividual: deleteIndividualMutation.mutate,

      // Groups operations
      addGroup: addGroupMutation.mutate,
      updateGroup: updateGroupMutation.mutate,
      deleteGroup: deleteGroupMutation.mutate,

      // Group membership operations
      addPersonToGroup: addPersonToGroupMutation.mutate,
      // convertIndividualToGroupMember:
      //   convertIndividualToGroupMemberMutation.mutate,

      // Update person operation
      updatePerson: updatePersonMutation.mutate,

      // Add this line to expose the new function
      removePersonFromGroup: removePersonFromGroupMutation.mutate,
    }),
    [
      storePartners,
      partners,
      selectedPartner,
      selectPartner,
      isLoadingPartners,
      refetchPartners,
      storeIndividuals,
      storeGroups,
      // Add this dependency
      storeHostelAssignments,
      isLoading,

      // Remove individualsError and groupsError from dependencies
      partnersError,
    ]
  );
}
