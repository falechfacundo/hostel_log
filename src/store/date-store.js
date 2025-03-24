import { create } from "zustand";
import { format, parseISO } from "date-fns";
import { persist } from "zustand/middleware";

export const useDateStore = create(
  persist(
    (set) => ({
      // Estado inicial con la fecha actual
      selectedDate: new Date(),
      dateStr: format(new Date(), "yyyy-MM-dd"),

      // Acción para actualizar la fecha
      setSelectedDate: (date) => {
        const newDate = new Date(date);
        set({
          selectedDate: newDate,
          dateStr: format(newDate, "yyyy-MM-dd"),
        });
      },
    }),
    {
      name: "selected-date-storage", // Unique name for localStorage key
      getStorage: () => localStorage, // Use localStorage for persistence
      partialize: (state) => ({
        selectedDate: state.selectedDate.toISOString(),
        dateStr: state.dateStr,
      }), // Store only what's needed
      onRehydrateStorage: () => (state) => {
        // Handle Date object rehydration
        if (state && state.selectedDate) {
          // Convert ISO string back to Date object
          const date = new Date(state.selectedDate);
          state.selectedDate = date;
          state.dateStr = format(date, "yyyy-MM-dd");
        }
      },
    }
  )
);
