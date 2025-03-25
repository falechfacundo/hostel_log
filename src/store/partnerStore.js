import { create } from "zustand";
import { toast } from "sonner";
import { persist } from "zustand/middleware";

export const usePartnerStore = create(
  persist(
    (set, get) => ({
      // Core state
      selectedPartner: null,
      groups: [],
      individuals: [],
      hostelAssignments: [],

      // Core actions
      setSelectedPartner: (partner) => {
        if (!partner) {
          set({
            selectedPartner: null,
            groups: [],
            individuals: [],
          });
          return;
        }

        set({
          selectedPartner: partner,
          groups: partner.groups || [],
          individuals: partner.individuals || [],
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

      // Reset store data function to clear persisted data
      clearStoreData: () => {
        set({
          selectedPartner: null,
          groups: [],
          individuals: [],
          hostelAssignments: [],
        });

        // Trigger partner-cleared event that components can listen for
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("partner-cleared", {
              detail: { cleared: true },
            })
          );
        }
      },
    }),
    {
      name: "partner-storage", // Unique name for localStorage key
      getStorage: () => localStorage, // Use localStorage for persistence
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
          console.log("Partner store rehydrated from storage");

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
