import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatea una fecha en un formato legible
export function formatDate(date, formatStr = "PPP") {
  if (!date) return "";

  try {
    // Usando locale español
    return format(new Date(date), formatStr, { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
}
