import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function DatePicker({
  date,
  onChange,
  isLoading,
  className,
  showFormattedDate = false,
}) {
  // Para almacenamiento en BD: formato ISO
  const isoDate = format(date, "yyyy-MM-dd");

  // Para mostrar al usuario: formato español
  const formattedDate = showFormattedDate
    ? format(date, "dd/MM/yyyy", { locale: es })
    : null;

  return (
    <div className={cn("relative", className)}>
      {showFormattedDate && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {formattedDate}
        </div>
      )}
      <input
        type="date"
        value={isoDate}
        onChange={onChange}
        className={cn(
          "w-full px-3 py-2 rounded-md border border-input bg-transparent",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        disabled={isLoading}
        // Añadir el atributo lang para ayudar con la localización
        lang="es"
      />
    </div>
  );
}
