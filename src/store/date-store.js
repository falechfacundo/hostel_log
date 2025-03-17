import { create } from "zustand";
import { format } from "date-fns";

export const useDateStore = create((set) => ({
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
}));
