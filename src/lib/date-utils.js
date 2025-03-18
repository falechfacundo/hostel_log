import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha para mostrar al usuario en formato español
 */
export const formatDisplayDate = (date) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: es });
};

/**
 * Formatea una fecha para guardar en la base de datos
 */
export const formatDatabaseDate = (date) => {
  if (!date) return null;
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
};

/**
 * Formatea fecha con formato largo para mostrar al usuario
 */
export const formatLongDate = (date) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  // 'PPPP' da un resultado como "14 de febrero de 2023"
  return format(dateObj, "PPPP", { locale: es });
};
