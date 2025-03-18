import { create } from "zustand";
import { queryClient } from "@/lib/queryClient";
import { partnerKeys, travelerKeys } from "@/hooks/useTravelers";
import { toast } from "sonner";

export const selectedPartnerKey = "selectedPartner";

export const usePartnerStore = create((set, get) => ({
  // State
  selectedPartner: queryClient.getQueryData(selectedPartnerKey) || null,
  partners: [],
  groups: [],
  individuals: [],
  isLoading: false,
  // Add hostelAssignments state
  hostelAssignments: [],
  allHostelAssignments: [], // Add new state for all assignments

  // Actions
  setSelectedPartner: (partner) => {
    try {
      // Check if partner exists
      if (!partner) {
        console.warn("Attempted to select a null or undefined partner");
        set({
          selectedPartner: null,
          groups: [],
          individuals: [],
        });
        queryClient.setQueryData(selectedPartnerKey, null);
        queryClient.setQueryData(travelerKeys.groups.lists(), []);
        queryClient.setQueryData(travelerKeys.individuals.lists(), []);
        return false;
      }

      // Create a stable copy of the partner object to avoid reference issues
      const partnerToStore = { ...partner };

      // Reset groups and individuals when changing partners
      // This ensures we don't show old data while new data loads
      const groupsToUse = partner.groups || [];
      const individualsToUse = partner.individuals || [];

      // Update both the store and React Query's cache
      set({
        selectedPartner: partnerToStore,
        groups: groupsToUse,
        individuals: individualsToUse,
      });

      queryClient.setQueryData(selectedPartnerKey, partnerToStore);
      queryClient.setQueryData(travelerKeys.groups.lists(), groupsToUse);
      queryClient.setQueryData(
        travelerKeys.individuals.lists(),
        individualsToUse
      );

      // Debounce notifications and other side effects
      if (window._partnerChangeTimeout) {
        clearTimeout(window._partnerChangeTimeout);
      }

      window._partnerChangeTimeout = setTimeout(() => {
        // Notify UI of the change
        // toast.info(`Partner: ${partner.name}`, {
        //   id: `partner-change-${partner.id}`,
        //   duration: 2000,
        // });

        // Dispatch event for other components
        window.dispatchEvent(
          new CustomEvent("partner-changed", {
            detail: { partner: partnerToStore },
          })
        );
      }, 300);

      return true;
    } catch (err) {
      console.error("Error selecting partner:", err);
      return false;
    }
  },

  setPartners: (partners) => {
    set({ partners });

    // Also update React Query's cache
    queryClient.setQueryData(partnerKeys.lists(), partners);
  },

  // Add methods for groups and individuals
  setGroups: (groups) => {
    set({ groups });

    // Also update React Query's cache
    queryClient.setQueryData(travelerKeys.groups.lists(), groups);
  },

  setIndividuals: (individuals) => {
    set({ individuals });

    // Also update React Query's cache
    queryClient.setQueryData(travelerKeys.individuals.lists(), individuals);
  },

  // Add action for hostelAssignments
  setHostelAssignments: (hostelAssignments) => set({ hostelAssignments }),

  // Add action for all hostel assignments
  setAllHostelAssignments: (allHostelAssignments) =>
    set({ allHostelAssignments }),

  // Update a specific group in the store
  updateGroup: (updatedGroup) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group
      ),
    }));
  },

  // Remove a group from the store
  removeGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
    }));
  },

  // Add a new group to the store
  addGroup: (newGroup) => {
    set((state) => ({
      groups: [...state.groups, newGroup],
    }));
  },

  // Update a specific individual in the store
  updateIndividual: (updatedIndividual) => {
    set((state) => ({
      individuals: state.individuals.map((individual) =>
        individual.id === updatedIndividual.id ? updatedIndividual : individual
      ),
    }));
  },

  // Remove an individual from the store
  removeIndividual: (individualId) => {
    set((state) => ({
      individuals: state.individuals.filter(
        (individual) => individual.id !== individualId
      ),
    }));
  },

  // Add a new individual to the store
  addIndividual: (newIndividual) => {
    set((state) => ({
      individuals: [...state.individuals, newIndividual],
    }));
  },

  // Helper method to sync with React Query's cache
  syncFromCache: () => {
    const cachedPartners = queryClient.getQueryData(partnerKeys.lists()) || [];
    const cachedSelectedPartner = queryClient.getQueryData(selectedPartnerKey);
    const cachedGroups =
      queryClient.getQueryData(travelerKeys.groups.lists()) || [];
    const cachedIndividuals =
      queryClient.getQueryData(travelerKeys.individuals.lists()) || [];

    set({
      partners: cachedPartners,
      selectedPartner: cachedSelectedPartner || null,
      groups: cachedGroups,
      individuals: cachedIndividuals,
    });

    return {
      partners: cachedPartners,
      selectedPartner: cachedSelectedPartner,
      groups: cachedGroups,
      individuals: cachedIndividuals,
    };
  },

  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
}));

// Helper hook to keep React Query and Zustand store in sync
export function useSyncPartnerStore() {
  const { syncFromCache, setLoading } = usePartnerStore();

  // This hook should be called at the app root level once
  return {
    syncFromCache,
    setLoading,
  };
}
