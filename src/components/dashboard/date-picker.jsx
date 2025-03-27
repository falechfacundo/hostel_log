import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function DatePicker({ date, onChange, isLoading, className }) {
  // Add validation to ensure date is valid, or fallback to today's date
  const safeDate =
    date instanceof Date && !isNaN(date.getTime()) ? date : new Date();

  const formattedDate = format(safeDate, "yyyy-MM-dd");
  const [inputValue, setInputValue] = useState(formattedDate);

  // Formato español para mostrar (dd/MM/yyyy)
  const spanishFormattedDate = format(safeDate, "dd/MM/yyyy", { locale: es });

  // Mantener el input sincronizado con la prop date
  useEffect(() => {
    // Only update if we have a valid date
    if (date instanceof Date && !isNaN(date.getTime())) {
      setInputValue(format(date, "yyyy-MM-dd"));
    }
  }, [date]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validar que sea una fecha válida antes de propagar el cambio
    const newDate = new Date(newValue + "T00:00:00");

    if (!isNaN(newDate.getTime())) {
      onChange({ target: { value: newValue } });
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="text-sm font-medium flex items-center gap-1">
        <span>Fecha:</span>
      </div>
      <div className="flex items-center">
        <div className="relative border focus-within:ring-1 focus-within:ring-primary shadow-sm border-none">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 bg-white px-2 py-1">
            {spanishFormattedDate}
          </div>
          <input
            type="date"
            value={inputValue}
            onChange={handleInputChange}
            className="px-4 py-2 bg-background focus:outline-none w-[180px] text-transparent select-none"
          />
        </div>
      </div>
    </div>
  );
}
