import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Query keys
export const hostelKeys = {
  all: ["hostels"],
  lists: () => [...hostelKeys.all, "list"],
  list: (filters) => [...hostelKeys.lists(), { filters }],
  details: () => [...hostelKeys.all, "detail"],
  detail: (id) => [...hostelKeys.details(), id],
};

// Fetch all hostels with rooms
const fetchHostels = async () => {
  const { data, error } = await supabase
    .from("hostels")
    .select(
      `
      *,
      rooms(*)
    `
    )
    .order("name");

  if (error) throw error;
  return data;
};

// Fetch all hostels with rooms and current assignments
const fetchHostelsWithAssignments = async (date) => {
  const dateStr = format(new Date(date), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("hostels")
    .select(
      `
      *,
      rooms!hostel_id(*),
      rooms!hostel_id(
        assignments!room_id!inner(
          *,
          groups!group_id(*),
          person!person_id(*)
        )
      )
    `
    )
    .eq("rooms.assignments.date", dateStr)
    .order("name");

  if (error) throw error;
  return data;
};

// Fetch a single hostel with its rooms
const fetchHostelById = async (id) => {
  const { data, error } = await supabase
    .from("hostels")
    .select(
      `
      *,
      rooms(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create a new hostel
const createHostel = async (hostelData) => {
  const { data, error } = await supabase
    .from("hostels")
    .insert([hostelData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a hostel
const updateHostel = async ({ id, data }) => {
  const { data: updatedData, error } = await supabase
    .from("hostels")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedData;
};

// Delete a hostel
const deleteHostel = async (id) => {
  const { error } = await supabase.from("hostels").delete().eq("id", id);

  if (error) throw error;
  return { id };
};

// Hook for accessing and manipulating hostels
export function useHostels() {
  const queryClient = useQueryClient();

  const {
    data: hostels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: hostelKeys.lists(),
    queryFn: fetchHostels,
  });

  // Add a hostel
  const addHostelMutation = useMutation({
    mutationFn: createHostel,
    onSuccess: (newHostel) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.lists() });
      toast.success("Albergue creado exitosamente");
    },
    onError: (err) => {
      toast.error(`Error al crear albergue: ${err.message}`);
    },
  });

  // Update a hostel
  const updateHostelMutation = useMutation({
    mutationFn: updateHostel,
    onSuccess: (updatedHostel) => {
      queryClient.invalidateQueries({
        queryKey: hostelKeys.detail(updatedHostel.id),
      });
      queryClient.invalidateQueries({ queryKey: hostelKeys.lists() });
      toast.success("Albergue actualizado exitosamente");
    },
    onError: (err) => {
      toast.error(`Error al actualizar albergue: ${err.message}`);
    },
  });

  // Delete a hostel
  const deleteHostelMutation = useMutation({
    mutationFn: deleteHostel,
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.lists() });
      queryClient.removeQueries({ queryKey: hostelKeys.detail(id) });
      toast.success("Albergue eliminado");
    },
    onError: (err) => {
      toast.error(`Error al eliminar albergue: ${err.message}`);
    },
  });

  return {
    hostels,
    isLoading,
    error,
    addHostel: addHostelMutation.mutate,
    updateHostel: updateHostelMutation.mutate,
    deleteHostel: deleteHostelMutation.mutate,
  };
}

// Hook for a single hostel details
export function useHostel(id) {
  return useQuery({
    queryKey: hostelKeys.detail(id),
    queryFn: () => fetchHostelById(id),
    enabled: !!id,
  });
}

// Crear un nuevo hook que traiga todo junto
export function useHostelsWithAssignments(date) {
  return useQuery({
    queryKey: [...hostelKeys.lists(), { date }],
    queryFn: () => fetchHostelsWithAssignments(date),
    enabled: !!date,
  });
}
